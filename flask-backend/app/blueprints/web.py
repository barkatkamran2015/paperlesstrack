from flask import Blueprint, jsonify, request


web_bp = Blueprint("web", __name__)


@web_bp.route("/", methods=['GET'])
def index():
    return jsonify({"message": "API is online"}), 200