from email_validator import EmailNotValidError, validate_email


def normalize_email(value: str) -> str:
    try:
        return validate_email(value, check_deliverability=False).normalized
    except EmailNotValidError:
        raise ValueError("Niepoprawny adres e-mail")
