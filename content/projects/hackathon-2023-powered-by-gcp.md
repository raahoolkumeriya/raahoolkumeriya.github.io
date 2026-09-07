+++
title = "Hackathon 2023 Powered by GCP"
description = "Hybrid Workplace Time & Resource Forecasting System built with Facebook Prophet, GCP, and Streamlit."
weight = 2
date = 2023-07-20

[extra]
badge = "GCP Hackathon 2023"
github = "https://github.com/raahoolkumeriya/hackathon2023"


tags = ["GCP", "Machine Learning", "Time Series", "Streamlit", "Python", "Facebook Prophet"]
+++

### Overview

Developed during the **Google Cloud Platform (GCP) Hackathon 2023**, this system delivers an intelligent time-series forecasting application designed to tackle post-pandemic hybrid workplace challenges. By accurately forecasting office attendance, cafeteria food catering demand, and hot-desk utilization, organizations can optimize facilities operational expenditure while enhancing employee workplace satisfaction.

### Key Architectural Highlights

- **Time-Series ML Forecasting Engine**: Employs Facebook Prophet models (`prophet_model.json`) trained on historical attendance matrices, seasonal holiday calendars, and day-of-week trends to project forward workplace resource requirements.
- **Google Cloud Platform Integration**: Utilizes GCP infrastructure for scalable batch data ingestion, containerized execution via custom Docker containers, and robust pipeline automation.
- **Interactive Streamlit Dashboard**: Provides a responsive, real-time command interface (`app.py`) allowing facility directors and floor managers to simulate sudden attendance surges, adjust prediction windows, and export demand schedules.
- **Exploratory Data Analytics (EDA)**: Includes comprehensive Jupyter analysis notebooks (`timeseries.ipynb`, `eda.ipynb`) detailing feature selection, autocorrelation checks, and cross-validation metrics.

### Technology Stack

- **Machine Learning**: Facebook Prophet, Pandas, NumPy, Scikit-Learn
- **User Interface**: Streamlit, Matplotlib, Seaborn
- **Cloud Infrastructure**: Google Cloud Platform (GCP), Docker
- **Repository**: [GitHub - hackathon2023](https://github.com/raahoolkumeriya/hackathon2023)
