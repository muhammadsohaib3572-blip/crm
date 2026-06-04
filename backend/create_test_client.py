from app.database.session import AsyncSessionLocal
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate
from datetime import date

async def create_test_client():
    async with AsyncSessionLocal() as db:
        client_repo = ClientRepository(db)
        
        # Create test client
        client_data = ClientCreate(
            name="Test Client",
            company_name="Test Company",
            farm_size=100.5,
            address="123 Test Street",
            contact_info="test@example.com",
            onboarding_date=date.today()
        )
        
        client = await client_repo.create(client_data)
        print(f"Test client created successfully: {client.name} (ID: {client.id})")

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_test_client())