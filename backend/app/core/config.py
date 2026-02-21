from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    MONGO_URI: str
    MONGO_DB: str = 'avagama'
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRE_MINUTES: int = 1440
    MISTRAL_API_URL: str
    MISTRAL_API_KEY: str
    PROCESS_AGENT_ID: str
    USE_CASE_AGENT_ID: str
    COMPANY_USE_CASE_AGENT_ID: str
    FRONTEND_URL: str = 'http://localhost:5173'
    EMAIL_VERIFY_EXPIRE_MINUTES: int = 1440
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None


settings = Settings()
