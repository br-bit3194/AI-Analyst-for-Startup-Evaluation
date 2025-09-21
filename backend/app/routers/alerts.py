# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import firebase_admin
# from firebase_admin import credentials, messaging

# # Initialize Firebase once
# cred = credentials.Certificate("path/to/firebase_service_account.json")
# firebase_admin.initialize_app(cred)

# router = APIRouter(prefix="/alerts", tags=["alerts"])

# class AlertRequest(BaseModel):
#     title: str
#     message: str
#     topic: str  # e.g., "founder_updates", "competitor_news"

# @router.post("/send")
# async def send_alert(alert: AlertRequest):
#     try:
#         message = messaging.Message(
#             notification=messaging.Notification(
#                 title=alert.title,
#                 body=alert.message
#             ),
#             topic=alert.topic
#         )
#         response = messaging.send(message)
#         return {"success": True, "response": response}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))




# {
#   "type": "service_account",
#   "project_id": "your-firebase-project-id",
#   "private_key_id": "some-long-id",
#   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANB ... \n-----END PRIVATE KEY-----\n",
#   "client_email": "firebase-adminsdk-xxxx@your-firebase-project-id.iam.gserviceaccount.com",
#   "client_id": "some-id",
#   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#   "token_uri": "https://oauth2.googleapis.com/token",
#   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
#   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxx%40your-firebase-project-id.iam.gserviceaccount.com"
# }


from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["alerts"])

class AlertRequest(BaseModel):
    title: str
    message: str
    topic: str

@router.post("/send")
async def send_alert(alert: AlertRequest):
    # Mock sending
    print(f"Mock Alert -> Title: {alert.title}, Message: {alert.message}, Topic: {alert.topic}")
    return {"success": True, "message": "Alert sent (mocked)"}
