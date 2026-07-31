def calculate(expression):
    """Evaluate a simple arithmetic expression with +, -, *, /."""
    try:
        # Only allow digits, whitespace, and arithmetic operators
        allowed = set("0123456789+-*/. ()")
        if not set(expression) <= allowed:
            raise ValueError("Invalid characters in expression")
        result = eval(expression, {"__builtins__": None}, {})
        return result
    except Exception as exc:
        raise ValueError(f"Invalid expression: {exc}") from exc


def main():
    print("Simple calculator. Enter an expression with +, -, *, / or type 'quit' to exit.")
    while True:
        try:
            expr = input("> ").strip()
        except EOFError:
            break
        if expr.lower() in {"quit", "exit"}:
            break
        if not expr:
            continue
        try:
            value = calculate(expr)
            print(value)
        except ValueError as err:
            print(err)


if __name__ == "__main__":
    main()