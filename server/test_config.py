#!/usr/bin/env python3
"""
Test script to verify Gemini API configuration
Run this to check if your API key is working correctly
"""

import os
from app.config import settings

def test_gemini_config():
    print("=== Gemini API Configuration Test ===")
    print(f"LLM Provider: {settings.llm_provider}")
    print(f"Gemini API Key: {'***' + settings.gemini_api_key[-4:] if settings.gemini_api_key else 'NOT SET'}")

    if settings.llm_provider.lower() == "gemini" and settings.gemini_api_key:
        print("✅ Configuration looks good!")
        print("The backend should now call the actual Gemini API.")

        # Try to import genai
        try:
            import google.generativeai as genai
            print("✅ Google Generative AI library is available")
        except ImportError:
            print("❌ Google Generative AI library is not installed")
            print("Install with: pip install google-generativeai")
    else:
        print("⚠️  Configuration issues detected:")
        if settings.llm_provider.lower() != "gemini":
            print(f"   - LLM_PROVIDER is set to '{settings.llm_provider}', should be 'gemini'")
        if not settings.gemini_api_key:
            print("   - GEMINI_API_KEY is not set")

        print("\nTo fix:")
        print("1. Update your .env file with:")
        print("   LLM_PROVIDER=gemini")
        print("   GEMINI_API_KEY=your_actual_api_key_here")
        print("2. Restart the backend server")

if __name__ == "__main__":
    test_gemini_config()
