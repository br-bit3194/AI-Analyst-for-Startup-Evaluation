#!/usr/bin/env python3
"""
Test script to verify Gemini API configuration
Run this to check if your API key is working correctly
"""

import os
from app.config import settings

def test_gemini_config():
    print("=== Gemini API Configuration Test ===")
    print(f"LLM Provider: {settings.LLM_PROVIDER}")
    print(f"Gemini API Key: {'***' + settings.GEMINI_API_KEY[-4:] if settings.GEMINI_API_KEY else 'NOT SET'}")

    if settings.LLM_PROVIDER.lower() == "gemini" and settings.GEMINI_API_KEY:
        print("✅ Configuration looks good!")
        print("The backend should now call the actual Gemini API.")

        # Test the actual API call if everything is configured
        try:
            print("\nTesting Gemini API...")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Say hello!")
            print(f"✅ Gemini API test successful! Response: {response.text}")
        except Exception as e:
            print(f"⚠️  Gemini API test failed: {e}")
            print("Install with: pip install google-generativeai")
    else:
        print("⚠️  Configuration issues detected:")
        if settings.LLM_PROVIDER.lower() != "gemini":
            print(f"   - LLM_PROVIDER is set to '{settings.LLM_PROVIDER}', should be 'gemini'")
        if not settings.GEMINI_API_KEY:
            print("   - GEMINI_API_KEY is not set")

        print("\nTo fix:")
        print("1. Update your .env file with:")
        print("   LLM_PROVIDER=gemini")
        print("   GEMINI_API_KEY=your_actual_api_key_here")
        print("2. Restart the backend server")

if __name__ == "__main__":
    test_gemini_config()
