"""
Recoup Python Backend - Setup Configuration
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="recoup-backend",
    version="3.0.0",
    author="Recoup Team",
    author_email="dev@recoup.com",
    description="Smart invoicing and payment tracking for freelancers - Python Backend",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/recoup/recoup",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Office/Business :: Financial",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: Other/Proprietary License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.11",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=8.3.0",
            "pytest-asyncio>=0.24.0",
            "pytest-cov>=5.0.0",
            "black>=24.8.0",
            "flake8>=7.1.0",
            "mypy>=1.11.0",
            "isort>=5.13.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "recoup-api=main:app",
        ],
    },
)
