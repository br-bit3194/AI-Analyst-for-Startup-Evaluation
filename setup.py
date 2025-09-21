from setuptools import setup, find_packages

setup(
    name="ai-analyst-backend",
    version="0.1.0",
    packages=find_packages(where="backend"),
    package_dir={"": "backend"},
    install_requires=open('requirements-heroku.txt').read().splitlines(),
    python_requires=">=3.10,<3.11",
)
