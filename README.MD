# Project Name

**Project Description:**

This project is a web application that allows users to upload images, draw bounding boxes and polygons on them, and persist their annotations. Users can interact with the images by drawing shapes on them, and the application will save these annotations for future reference. When a user revisits an image, their previously saved drawings will reappear. Additionally, users can download their annotations as a text file, making it easy to share or export their work.

The main features of the app include:

- **Feature 1:** Image Upload: Users can upload images to the platform.

- **Feature 2:** Drawing Tools: Users can draw bounding boxes and polygons on the images.

- **Feature 3:** Persistent Annotations: Annotations are saved and reloaded when the user revisits the image.

- **Feature 4:** Downloadable Annotations: Users can export their annotations as a text file.

This application demonstrates key skills in both front-end and back-end development, with a focus on building interactive features and ensuring data persistence.

---

## Tech Stack

- **Frontend:** React, JSX, CSS
- **Backend:** FastAPI
- **Database:** sqlite

---

## Getting Started

These instructions will help you set up the project on your local machine for development and testing.

### Prerequisites

Before you start, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (Recommended version: v14 or later)
- [npm](https://www.npmjs.com/)
- [python3.10](https://www.python.org/)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)

1. ### Installing

    1. Clone the repository to your local machine:

        ```bash
        git clone https://github.com/zyle47/test-datadev.git
        ```
        
        This will create new folder called /dataDev-pub

    2. Navigate to the project folder:

        ```bash
        cd /dataDev-pub
        ```

    3. Install the dependencies:

        Navigate and set up server for frontend:
        
        ```bash
        cd /dataDev-pub/frontend
        npm install
        ```

        Navigate and set up server for backend:

        ```bash
        cd /dataDev-pub/backend
        python3.10 -m venv venv
        source venv/bin/activate (linux)
        ./venv/Scripts/activate (Windows)
        pip install -r requirements.txt
        ```

2. ## Starting the Development Server

    Once you have installed the dependencies, start the development server.

    Start the server:

    1. Frontend:
    
    ```bash
    cd /dataDev-pub/frontend
    npm start
    ```

    2. Backend:

    To run tests, use pytest module:
    
    ```bash
    cd /dataDev-pub/backend
    pytest test_main.py
    ```

    Start the server:

    ```bash
    cd /dataDev-pub/backend
    uvicorn main:app --reload
    ```

    3. In browser navigate to `http://localhost:3000` (default React port)
    4. In browser navigate to `http://localhost:8000` (default FastAPI port)

    **DONE!**


3. ### Installing with Docker

    Start everything at once with Docker (easy way):
        
    1. Navigate to main folder containing docker-compose.yml:
    ```    
    cd /dataDev-pub
    docker-compose up --build
    ```
    
    2. In browser navigate to `http://localhost:3000` (default React port)
    3. In browser navigate to `http://localhost:8000` (default FastAPI port)

    DONE!