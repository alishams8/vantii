from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json
import os
import yaml
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Analyzer API Gateway")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.get("/api/backend/health")
async def backend_health():
    """Forward health check to backend service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://backend:8000/health")
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
    except Exception as e:
        logger.error(f"Backend health check failed: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=503
        )

@app.post("/api/backend/create-analyzer")
async def create_analyzer(request: Request):
    """Handle analyzer creation requests"""
    try:
        body = await request.json()
        logger.info(f"Received create analyzer request for: {body.get('name', 'unknown')}")
        
        async with httpx.AsyncClient() as client:
            logger.info("Forwarding request to backend service")
            response = await client.post(
                "http://backend:8000/create-analyzer",
                json=body,
                timeout=30.0
            )
            
            logger.info(f"Backend response status: {response.status_code}")
            response_data = response.json()
            logger.info(f"Backend response data: {response_data}")
            
            return JSONResponse(
                content=response_data,
                status_code=response.status_code
            )
    except Exception as e:
        logger.error(f"Error creating analyzer: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@app.get("/health")
async def gateway_health():
    """Gateway health check"""
    return {
        "status": "healthy",
        "service": "gateway",
        "timestamp": datetime.now().isoformat()
    }

@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        },
    )

@app.delete("/api/backend/delete-analyzer/{analyzer_name}")
async def delete_analyzer(analyzer_name: str):
    """Forward delete analyzer request to backend service"""
    try:
        logger.info(f"Received delete analyzer request for: {analyzer_name}")
        
        async with httpx.AsyncClient() as client:
            logger.info("Forwarding delete request to backend service")
            response = await client.delete(
                f"http://backend:8000/delete-analyzer/{analyzer_name}",
                timeout=30.0
            )
            
            logger.info(f"Backend response status: {response.status_code}")
            response_data = response.json()
            logger.info(f"Backend response data: {response_data}")
            
            return JSONResponse(
                content=response_data,
                status_code=response.status_code
            )
    except Exception as e:
        logger.error(f"Error deleting analyzer: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

# Remove the general middleware since we have specific endpoints now 