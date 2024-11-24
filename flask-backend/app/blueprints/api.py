from flask import Blueprint, jsonify, request
from ..config import veryfi_config
import requests
from datetime import datetime
import json  # Import json to parse the categories
from ..categorizer import get_category

api_bp = Blueprint("api", __name__)

@api_bp.route("/process-receipt", methods=['POST'])
def process_receipt():
    # Get the uploaded file from the request
    file = request.files['file']

    # Get categories from the request form data and parse it as a list
    categories = json.loads(request.form.get('categories', '[]'))

    # Set parameters for forwarding image to VeryFI
    files = {
        'file': (file.filename, file, file.content_type)
    }

    vf_client_id = veryfi_config['client_id']
    vf_username = veryfi_config['username']
    vf_api_key = veryfi_config['api_key']
    vf_api_url = veryfi_config['api_url']

    headers = {
        'Accept': 'application/json',
        'Client-Id': vf_client_id,
        'Authorization': f"apikey {vf_username}:{vf_api_key}"
    }

    # Send the file to VeryFI to process
    vf_response = requests.post(vf_api_url, headers=headers, files=files)

    # Return extracted receipt details from VeryFI
    vf_data = vf_response.json()
    print("VeryFI Response Data:", vf_data)  # Debug: print full VeryFI response

    # Check if 'date' is present and handle missing or malformed dates
    if 'date' in vf_data and vf_data['date']:
        try:
            vf_date = datetime.strptime(vf_data['date'], "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d")
        except ValueError:
            vf_date = "N/A"  # Handle date parsing error
    else:
        vf_date = "N/A"  # Default if date is missing or invalid

    vf_items = []
    for item in vf_data.get('line_items', []):
        vf_items.append(item['description'])

    vendor = vf_data['vendor']['name'] if 'vendor' in vf_data and 'name' in vf_data['vendor'] else "Unknown Vendor"
    categories = ", ".join(categories)
    category = get_category(vendor, categories)

    # Function to fetch logo URL from an external service (e.g., Clearbit Logo API)
    def get_logo_url(vendor_name):
        try:
            domain = vendor_name.lower().replace(' ', '') + '.com'
            response = requests.get(f'https://logo.clearbit.com/{domain}')
            if response.status_code == 200:
                return response.url  # Return the URL if the request is successful
        except requests.RequestException as e:
            print(f"Error fetching logo for {vendor_name}: {e}")
        return ''  # Return an empty string if the logo is not found or an error occurs

    # Get the logo URL for the vendor
    logo_url = get_logo_url(vendor)

    # Debug: print constructed logo URL
    print("Constructed logo URL:", logo_url)

    receipt_data = {
        'id': vf_data.get('id', 'N/A'),  # Ensure an ID is included for frontend use
        'vendor': vendor,
        'total': vf_data['total'] if 'total' in vf_data else 0.0,
        'category': category,
        'date': vf_date,
        'items': vf_items,
        'logoUrl': logo_url  # Add the logo URL to the response
    }

    print("Final Receipt Data:", receipt_data)  # Debug: print final receipt data

    return jsonify(receipt_data), 201

@api_bp.route("/update-receipt", methods=['PUT'])
def update_receipt():
    # Parse the incoming JSON data
    data = request.get_json()
    receipt_id = data.get('id')
    new_category = data.get('category')

    # Debug: print the incoming data to verify
    print("Received update request for data:", data)  # Print the full incoming data

    if not receipt_id:
        print("Error: receipt_id is missing or None")
    if not new_category:
        print("Error: new_category is missing or None")

    if not receipt_id or not new_category:
        return jsonify({"error": "Invalid data. Receipt ID and category are required."}), 400

    # Simulate updating receipt category (in a real app, update the database)
    updated_receipt = {
        'id': receipt_id,
        'category': new_category,
        'message': "Category updated successfully"
    }

    print("Updated receipt data:", updated_receipt)  # Debug: print updated receipt data

    return jsonify(updated_receipt), 200
