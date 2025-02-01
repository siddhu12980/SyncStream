from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from config.config import Config
import uuid
import logging

import logging
import boto3
from botocore.exceptions import ClientError



  
password_context = CryptContext(
    schemes=['bcrypt']
)

ACCESS_TOKEN_EXPIRY = 3600

def generate_hash(password: str) -> str:
    return password_context.hash(password)

def verify_hash(password: str, hash: str) -> bool:
    return password_context.verify(password, hash)

def generate_token(user_data: dict, expiry: timedelta = None, refresh: bool = False):
    payload = {}
    payload['user'] = user_data
    payload['exp'] = datetime.now() + (
        expiry if expiry is not None else timedelta(seconds=ACCESS_TOKEN_EXPIRY)
    )

    payload['jti'] = str(uuid.uuid4())

    payload['refresh'] = refresh

    token = jwt.encode(
        payload=payload,
        key=Config.JWT_SECRET,
        algorithm=Config.JWT_ALGORITHM
    )

    return token

def decode_token(token: str) -> dict:
    try:
        token_data = jwt.decode(
            jwt=token, key=Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM]
        )

        return token_data
    
    except jwt.PyJWTError as e:
        logging.exception(e)
        return None
    
    


async def create_presigned_post(object_name, fields=None, conditions=None, expiration=3600 * 5):

    bucket_name = "sidd-bucket-fast-api"
    
    s3_client = boto3.client('s3')
    
    if conditions is None:
        conditions = []
    # Allow files up to 100MB - adjust as needed
    conditions.append(['content-length-range', 1, 100 * 1024 * 1024])
    
    # cors_configuration = {
    # 'CORSRules': [{
    #     'AllowedHeaders': ['Authorization'],
    #     'AllowedMethods': ['GET', 'PUT' , 'POST'],
    #     'AllowedOrigins': ['*'],
    #     'ExposeHeaders': ['ETag', 'x-amz-request-id'],
    #     'MaxAgeSeconds': 3000
    # }]
    
    # }
    
    # s3_client.put_bucket_cors(Bucket=bucket_name,
    #                CORSConfiguration=cors_configuration)
    
    
    try:

        response = s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=object_name,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=expiration,
        )
        
            
        return response
        
    except ClientError as e:
        logging.error(f"Error generating presigned URL: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return None
    
def verify_file_upload(object_key):
    s3_client = boto3.client('s3')
    bucket_name = "sidd-bucket-fast-api"
    
    # List of accepted video MIME types
    valid_video_types = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/webm',
        'video/x-matroska'
    ]
    
    try:
        response = s3_client.head_object(
            Bucket=bucket_name,
            Key=object_key
        )
        
        content_type = response.get('ContentType', '')
        
        if content_type in valid_video_types:
            return True
        
        else:
            print(f"Invalid file type: {content_type}. Expected a video file.")
            return False
            
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        else:
            raise e


async def generate_presigned_url(object_key):
    print("Generating presigned URL for object: ", object_key)
    
    s3_client = boto3.client('s3')
    
    bucket_name = "sidd-bucket-fast-api"
    
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
                'ContentType': 'video/mp4'
                
            },
            ExpiresIn=3600,  # URL expires in 1 hour
            HttpMethod='PUT'
        )
        return url
    except ClientError as e:
        print(f"Error generating presigned URL: {str(e)}")
        raise e