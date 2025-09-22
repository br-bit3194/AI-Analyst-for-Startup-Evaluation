from setuptools import setup, find_packages

# Read requirements from requirements.txt
with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name="ai-analyst-backend",
    version="0.1.0",
    packages=find_packages(where="backend"),
    package_dir={"": "backend"},
    install_requires=required,
    python_requires=">=3.10,<3.11",
    include_package_data=True,
    zip_safe=False,
    entry_points={
        'console_scripts': [
            'ai-analyst=app.main:main',
        ],
    },
)
