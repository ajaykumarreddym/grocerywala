import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import motor.motor_asyncio
from pymongo.errors import DuplicateKeyError

class Settings(BaseSettings):
    mongo_url: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/grocery_platform')
    firebase_project_id: str = os.environ.get('FIREBASE_PROJECT_ID', 'dummy-project-id')
    firebase_api_key: str = os.environ.get('FIREBASE_API_KEY', 'dummy-api-key')

settings = Settings()

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongo_url)
db = client.grocery_platform

# FastAPI app
app = FastAPI(title="Multi-Service Platform API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: str
    role: str = "customer"  # customer, driver, admin, vendor
    location: Dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # grocery, electronics, fashion, etc.
    vendor_id: str
    location: Dict[str, Any]
    is_active: bool = True
    rating: float = 0.0
    delivery_time: str = "30-45 mins"
    created_at: datetime = Field(default_factory=datetime.now)

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    store_id: str
    images: List[str] = []
    stock: int = 0
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

class CabService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_type: str  # economy, premium, suv
    available_slots: int
    price_per_km: float
    base_fare: float
    location: Dict[str, Any]
    is_active: bool = True

class CabBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    driver_id: Optional[str] = None
    pickup_location: Dict[str, Any]
    destination: Dict[str, Any]
    service_type: str
    status: str = "pending"  # pending, confirmed, in-progress, completed, cancelled
    fare: float = 0.0
    booking_time: datetime = Field(default_factory=datetime.now)

class HandymanService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # plumbing, electrical, cleaning, etc.
    professional_id: str
    name: str
    description: str
    price_range: str
    rating: float = 0.0
    availability: List[str] = []
    location: Dict[str, Any]
    is_active: bool = True

class HandymanBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_id: str
    professional_id: str
    booking_date: str
    time_slot: str
    status: str = "pending"
    price: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    store_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    delivery_address: Dict[str, Any]
    status: str = "pending"  # pending, confirmed, preparing, out_for_delivery, delivered
    order_time: datetime = Field(default_factory=datetime.now)
    estimated_delivery: datetime = Field(default_factory=lambda: datetime.now() + timedelta(minutes=45))

# Auth middleware (dummy for now)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    # In production, verify Firebase token here
    return {"uid": "dummy-user-id", "email": "user@example.com"}

# Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Multi-Service Platform API"}

# User Management
@app.post("/api/users")
async def create_user(user: User):
    try:
        result = await db.users.insert_one(user.dict())
        return {"message": "User created successfully", "user_id": user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Store Management
@app.get("/api/stores")
async def get_stores(category: Optional[str] = None):
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    stores = []
    async for store in db.stores.find(query):
        stores.append(store)
    return {"stores": stores}

@app.post("/api/stores")
async def create_store(store: Store, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.stores.insert_one(store.dict())
        return {"message": "Store created successfully", "store_id": store.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Product Management
@app.get("/api/products")
async def get_products(store_id: Optional[str] = None, category: Optional[str] = None):
    query = {"is_available": True}
    if store_id:
        query["store_id"] = store_id
    if category:
        query["category"] = category
    
    products = []
    async for product in db.products.find(query):
        products.append(product)
    return {"products": products}

@app.post("/api/products")
async def create_product(product: Product, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.products.insert_one(product.dict())
        return {"message": "Product created successfully", "product_id": product.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Order Management
@app.post("/api/orders")
async def create_order(order: Order, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.orders.insert_one(order.dict())
        return {"message": "Order created successfully", "order_id": order.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/orders")
async def get_orders(user_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    
    orders = []
    async for order in db.orders.find(query):
        orders.append(order)
    return {"orders": orders}

# Cab Service Management
@app.get("/api/cab-services")
async def get_cab_services():
    services = []
    async for service in db.cab_services.find({"is_active": True}):
        services.append(service)
    return {"services": services}

@app.post("/api/cab-bookings")
async def create_cab_booking(booking: CabBooking, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.cab_bookings.insert_one(booking.dict())
        return {"message": "Cab booking created successfully", "booking_id": booking.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/cab-bookings")
async def get_cab_bookings(user_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    
    bookings = []
    async for booking in db.cab_bookings.find(query):
        bookings.append(booking)
    return {"bookings": bookings}

# Handyman Services
@app.get("/api/handyman-services")
async def get_handyman_services(category: Optional[str] = None):
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    services = []
    async for service in db.handyman_services.find(query):
        services.append(service)
    return {"services": services}

@app.post("/api/handyman-bookings")
async def create_handyman_booking(booking: HandymanBooking, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.handyman_bookings.insert_one(booking.dict())
        return {"message": "Handyman booking created successfully", "booking_id": booking.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/handyman-bookings")
async def get_handyman_bookings(user_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    
    bookings = []
    async for booking in db.handyman_bookings.find(query):
        bookings.append(booking)
    return {"bookings": bookings}

# Analytics & Dashboard
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_stores = await db.stores.count_documents({"is_active": True})
    total_bookings = (
        await db.cab_bookings.count_documents({}) + 
        await db.handyman_bookings.count_documents({})
    )
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_stores": total_stores,
        "total_bookings": total_bookings,
        "revenue": 125000.0,  # Dummy data
        "growth_rate": 15.5,  # Dummy data
    }

# Initialize sample data
@app.on_event("startup")
async def startup_event():
    # Create sample stores
    sample_stores = [
        {
            "id": "store-1",
            "name": "Fresh Mart Kadapa",
            "description": "Premium grocery store with fresh vegetables and fruits",
            "category": "grocery",
            "vendor_id": "vendor-1",
            "location": {"city": "Kadapa", "state": "Andhra Pradesh", "pincode": "516001"},
            "rating": 4.5,
            "delivery_time": "20-30 mins",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "store-2", 
            "name": "Electronics Hub",
            "description": "Latest electronics and gadgets",
            "category": "electronics",
            "vendor_id": "vendor-2",
            "location": {"city": "Kadapa", "state": "Andhra Pradesh", "pincode": "516001"},
            "rating": 4.2,
            "delivery_time": "45-60 mins",
            "is_active": True,
            "created_at": datetime.now()
        }
    ]
    
    for store in sample_stores:
        existing = await db.stores.find_one({"id": store["id"]})
        if not existing:
            await db.stores.insert_one(store)

    # Create sample products
    sample_products = [
        {
            "id": "prod-1",
            "name": "Fresh Tomatoes",
            "description": "Farm fresh tomatoes from local farms",
            "price": 40.0,
            "category": "vegetables",
            "store_id": "store-1",
            "images": ["https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9"],
            "stock": 100,
            "is_available": True,
            "created_at": datetime.now()
        },
        {
            "id": "prod-2",
            "name": "Basmati Rice (5kg)",
            "description": "Premium quality basmati rice",
            "price": 450.0,
            "category": "groceries",
            "store_id": "store-1",
            "images": ["https://images.unsplash.com/photo-1695653422259-8a74ffe90401"],
            "stock": 50,
            "is_available": True,
            "created_at": datetime.now()
        }
    ]
    
    for product in sample_products:
        existing = await db.products.find_one({"id": product["id"]})
        if not existing:
            await db.products.insert_one(product)

    # Create sample cab services
    sample_cab_services = [
        {
            "id": "cab-1",
            "service_type": "economy",
            "available_slots": 15,
            "price_per_km": 12.0,
            "base_fare": 50.0,
            "location": {"city": "Kadapa", "state": "Andhra Pradesh"},
            "is_active": True
        },
        {
            "id": "cab-2",
            "service_type": "premium",
            "available_slots": 8,
            "price_per_km": 18.0,
            "base_fare": 80.0,
            "location": {"city": "Kadapa", "state": "Andhra Pradesh"},
            "is_active": True
        }
    ]
    
    for service in sample_cab_services:
        existing = await db.cab_services.find_one({"id": service["id"]})
        if not existing:
            await db.cab_services.insert_one(service)

    # Create sample handyman services
    sample_handyman_services = [
        {
            "id": "handy-1",
            "category": "plumbing",
            "professional_id": "prof-1",
            "name": "Expert Plumbing Services",
            "description": "Professional plumbing repairs and installations",
            "price_range": "₹300-₹800",
            "rating": 4.7,
            "availability": ["morning", "afternoon", "evening"],
            "location": {"city": "Kadapa", "state": "Andhra Pradesh"},
            "is_active": True
        },
        {
            "id": "handy-2",
            "category": "electrical",
            "professional_id": "prof-2",
            "name": "Electrical Solutions",
            "description": "Complete electrical repairs and maintenance",
            "price_range": "₹250-₹600",
            "rating": 4.5,
            "availability": ["morning", "afternoon"],
            "location": {"city": "Kadapa", "state": "Andhra Pradesh"},
            "is_active": True
        }
    ]
    
    for service in sample_handyman_services:
        existing = await db.handyman_services.find_one({"id": service["id"]})
        if not existing:
            await db.handyman_services.insert_one(service)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)