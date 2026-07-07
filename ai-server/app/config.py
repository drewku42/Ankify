from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Which vision LLM provider to use for card generation: "openai" or "google".
    # Kept on "openai"/gpt-4o by default so prod is unchanged until an env var flips it.
    llm_provider: str = "openai"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    s3_endpoint_url: str = "http://localhost:4566"
    s3_bucket_uploads: str = "ankify-uploads"
    s3_bucket_exports: str = "ankify-exports"
    aws_region: str = "us-east-1"
    aws_access_key_id: str = "test"
    aws_secret_access_key: str = "test"

    # Comma-separated URLs (not JSON). e.g. CORS_ORIGINS=https://ankify.io,https://api.ankify.io
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
