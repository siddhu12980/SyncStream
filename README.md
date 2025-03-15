# SyncStream: Real-time Video Streaming Platform

SyncStream is a real-time video streaming platform built with React, TypeScript, FastAPI, and Celery. It allows users to create and join rooms to watch videos together in sync.

## Key Features

*   **Real-time Synchronization:**  Uses WebSockets for synchronized video playback across all viewers in a room.
*   **Room Management:** Users can create and join rooms, add videos to rooms, and manage room settings.
*   **Authentication:** Secure user authentication with signup and sign-in functionality.
*   **Video Processing:** Utilizes Celery and FFmpeg for background video transcoding to HLS format.
*   **Cloud Storage:** Leverages AWS S3 for storing and serving video content.
*   **Responsive UI:** Built with React and Tailwind CSS for a modern and responsive user interface.

## Technologies Used

### Frontend

*   **React:** A JavaScript library for building user interfaces.
*   **React Query:** A library for fetching, caching, and updating asynchronous data in React.
*   **React Player:** A library for playing a variety of URLs, including file paths, YouTube, Facebook, Twitch, SoundCloud, Streamable, Vimeo, Wistia and DailyMotion.

### Backend

*   **FastAPI:** A modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.
*   **SQLModel:** A library for interacting with SQL databases in a type-safe way.
*   **Celery:** A distributed task queue for handling asynchronous tasks.
*   **Redis:** An in-memory data structure store, used as a Celery broker and result backend.
*   **FFmpeg:** A complete, cross-platform solution to record, convert and stream audio and video.
*   **Boto3:** The AWS SDK for Python, used to interact with AWS services like S3.

### Infrastructure

*   **AWS S3:**  Scalable cloud storage for storing video files and HLS playlists.
*   **AWS Lambda:** Serverless compute service used to trigger video processing upon S3 upload completion.

## Architecture

1.  **User Interface (Frontend):**

2.  **API (Backend):**
 
3.  **Video Processing (Celery Worker):**

4.  **Cloud Storage (AWS S3):**
  
5.  **Event Trigger (AWS Lambda):**

## Frontend Setup

1.  Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

## Backend Setup

1.  Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

2.  Create a virtual environment:

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Linux/macOS
    venv\Scripts\activate  # On Windows
    ```

3.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4.  Configure environment variables:

    *   Create a `.env` file in the `backend` directory.
    *   Set the following environment variables:

        ```
        DATABASE_URL=<your_database_url>
        CELERY_BROKER_URL=<your_redis_broker_url>
        CELERY_RESULT_BACKEND=<your_redis_result_backend_url>
        ```

5.  Initialize the database:

    ```bash
    python backend/server/db/db.py
    ```

6.  Start the FastAPI server:

    ```bash
    python backend/server/main.py
    ```

## Celery Worker Setup

1.  Ensure Redis is running.

2.  Start the Celery worker from the `backend` directory:

    ```bash
    celery -A backend.worker.tasks worker --loglevel=INFO
    ```

## AWS Lambda Setup

1.  Create an AWS Lambda function.
2.  Configure the Lambda function to trigger on S3 object creation events.
3.  Add the necessary environment variables to the Lambda function (e.g., Celery broker URL).
4.  Implement the Lambda function to initiate the video processing task by calling the Celery worker.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to suggest improvements or report bugs.
