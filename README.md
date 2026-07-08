# AI-Powered Interview Simulator

## Project Overview

AI-Powered Interview Simulator is a full-stack AI-based interview preparation platform that simulates real-world technical and HR interviews.
The application allows users to practice interviews, receive AI-generated feedback, analyze their performance, and improve their interview preparation skills.
The platform is built using Spring Boot, JWT Authentication, MySQL, and Groq AI models to provide an interactive and realistic interview experience similar to an actual technical screening round.

---

## Features

### AI Interview Simulation

- Conduct realistic AI-powered technical and HR interviews.
- Generate dynamic interview questions using AI.
- Supports multiple interview categories:
  - Technical Interview
  - HR Interview
  - Mixed Interview

### AI-Powered Evaluation

- Evaluates user responses using AI.
- Provides detailed feedback on:
  - Technical knowledge
  - Communication skills
  - Confidence
  - Improvement areas
- Generates interview performance scores.

### Secure Authentication

- JWT-based authentication system.
- User registration and login functionality.
- Role-based authorization.
- Password encryption using Spring Security.

### Performance Tracking

- Stores previous interview attempts.
- Maintains interview history.
- Tracks:
  - Interview scores
  - Performance improvement
  - Weak areas

### Interview Monitoring

- Provides a controlled interview environment.
- Detects suspicious activities:
  - Tab switching
  - Copy and paste actions
  - Right-click attempts
  - Full-screen exit
  - Internet disconnection
- Implements a warning-based monitoring system.

### Interactive Interview Experience

- User-friendly interview dashboard.
- Real-time question and answer flow.
- Timer-based interview sessions.
- Multiple interview modes.

---

## Technologies Used

### Backend

- Java 21
- Spring Boot 3.2
- Spring Security
- JWT Authentication
- Spring Data JPA
- Hibernate
- REST APIs

### Database

- MySQL 8+

### AI Integration

- Groq API
- Llama AI Models

### Frontend

- HTML5
- CSS3
- JavaScript

### Tools

- Maven
- Git
- GitHub
- IntelliJ IDEA

---

## Project Architecture

The application follows a layered architecture:

### Controller Layer

Handles HTTP requests and manages communication between the frontend and backend.

### Service Layer

Contains business logic, interview processing, and AI integration.

### Repository Layer

Handles database operations using Spring Data JPA.

### Entity Layer

Defines database models using Hibernate entities.

### Security Layer

Manages JWT authentication and application security.

---

## Prerequisites

Before running the project, ensure the following are installed:

- Java Development Kit (JDK) 21
- Maven
- MySQL Server 8+
- Git
- IntelliJ IDEA or any Java-supported IDE

Required configurations:

- MySQL database setup
- Groq API key configuration
- Application properties configuration

---
## Steps to Run the Project

1. Install the required software:
  - Java JDK 21
  - Maven
  - MySQL Server 8+

2. Clone the repository:
   Using `git clone <repository-url>`.

3. Open the project in IntelliJ IDEA or any Java IDE.

4. Create a database named `interview_simulator`.
- Update the database username and password in `application.properties`.

5. Configure Groq AI:
- Add your Groq API key in the `application.properties` file.

6. Build the project:
   mvn clean install

7. Run the Spring Boot application:
   mvn spring-boot:run

8. Open the application in your browser: 
   http://localhost:8080

9.  Register a new account and start using the AI Interview Simulator.



## Objectives

The objectives of this project are:

- To develop an AI-powered interview practice platform.
- To simulate real-world technical and HR interview scenarios.
- To provide instant AI-generated feedback.
- To help users improve interview preparation.
- To analyze performance and track progress over time.
- To create an interactive environment for self-assessment.

## Testing Instructions

- Authentication Testing
- Register a new user account.
- Login using valid credentials.
- Interview Testing
- Select an interview category.
- Start an interview session.
- Check AI evaluation results.
- Security Testing


## Interview Monitoring Testing:

- Switching browser tabs.
- Copying and pasting content.
- Exiting full-screen mode.
- Disconnecting internet connection.

Verify that the warning system responds correctly.

-- Made by Nivya Mahajan 08/07/2026