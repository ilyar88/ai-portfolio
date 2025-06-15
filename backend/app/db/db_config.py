from urllib.parse import quote_plus
from pydantic import BaseModel


class PostgresConfig(BaseModel):
    server: str = "https://fly.io/apps/pgvector-db"
    port: int = 5432
    db_name: str
    user: str
    password: str

    def get_connection_url(self) -> str:
        encoded_password = quote_plus(self.password)
        return f"postgresql://{self.user}:{encoded_password}@{self.server}:{self.port}/{self.db_name}"