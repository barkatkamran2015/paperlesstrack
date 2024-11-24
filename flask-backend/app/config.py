import os
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
env_path = os.path.join(root_dir, '.env')
load_dotenv(env_path)

veryfi_config = {
    "client_id": os.getenv('VF_CLIENT_ID'),
    "client_secret": os.getenv('VF_CLIENT_SECRET'),
    "username": os.getenv('VF_USERNAME'),
    "api_key": os.getenv('VF_API_KEY'),
    "api_url": os.getenv('VF_API_URL')
}

openai_config = {
    "api_key": os.getenv('OPENAI_API_KEY')
}