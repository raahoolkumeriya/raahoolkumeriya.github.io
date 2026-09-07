+++
title = "WhatsApp Chat Analysis with Streamlit"
description = "Data Science and NLP application for analyzing iOS and Android WhatsApp chat exports."
weight = 4
date = 2021-09-15

[extra]
badge = "Streamlit Weekly Feature"
github = "https://github.com/raahoolkumeriya/whatsapp-chat-streamlit"


tags = ["Streamlit", "Data Science", "NLP", "Pandas", "Python", "Data Visualization"]
+++

### Overview

An interactive Natural Language Processing (NLP) and exploratory data analysis application designed to parse and visualize exported conversation transcripts from both **iOS** and **Android** WhatsApp clients. It extracts granular communication dynamics, temporal interaction heatmaps, emoji sentiment distributions, and linguistic word clouds.

### Key Capabilities

- **Multilingual WordCloud Engine**: Extracts lexicons across more than 50 natural languages with customizable stop-word exclusion and regex-based emoji separation.
- **Member Participation & Temporal Heatmaps**: Calculates message volume per participant, monthly timeline spikes, active hourly brackets, and weekly busy-day matrix heatmaps.
- **Emoji Distribution & Sentiment Scoring**: Maps emoji frequencies across group and one-on-one threads, visualizing emotional dynamics and communication patterns over time.
- **Streamlit Interactive UI**: Built with Streamlit, Pandas, Matplotlib, and Seaborn to allow users to drag-and-drop raw `.txt` export archives for immediate client-side visualization.

### Technology Stack

- **Data Processing**: Python, Pandas, Regex
- **NLP & Visualization**: WordCloud, Matplotlib, Seaborn
- **Web App**: Streamlit
- **Repository**: [GitHub - whatsapp-chat-streamlit](https://github.com/raahoolkumeriya/whatsapp-chat-streamlit)
