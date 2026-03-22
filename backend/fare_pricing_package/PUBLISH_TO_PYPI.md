# Publish and Use carpool-fare-engine

This package is ready to publish to PyPI.

## 1) Build distributions

```bash
cd backend/fare_pricing_package
python3 -m pip install --upgrade build twine
python3 -m build
```

This creates:
- dist/carpool_fare_engine-0.1.0-py3-none-any.whl
- dist/carpool_fare_engine-0.1.0.tar.gz

## 2) Upload to TestPyPI (recommended first)

```bash
python3 -m twine upload --repository testpypi dist/*
```

## 3) Upload to PyPI

```bash
python3 -m twine upload dist/*
```

## 4) Install in backend using pip

```bash
cd backend/smart_rental
python3 -m pip install carpool-fare-engine==0.1.0
```

For local development, install from local source:

```bash
python3 -m pip install ../fare_pricing_package
```

## 5) Pin in requirements

After publishing, add this to backend/smart_rental/requirements.txt:

```txt
carpool-fare-engine==0.1.0
```

## Notes

- The backend already imports this package when installed.
- If package import fails, backend falls back to internal logic so production remains resilient.
