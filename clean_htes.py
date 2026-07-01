#!/usr/bin/env python
from operator import index
import os
import argparse
import pandas as pd
from datetime import datetime
data = pd.ExcelFile("./datasets/hte-2021-2026.xlsx")

# Create a folder
folder_name = "datasets"
os.makedirs(folder_name, exist_ok=True)

parser = argparse.ArgumentParser(
        description="A simple script to demonstrate argparse."
    )

parser.add_argument(
    "path",
    type=str,
    help="The path to HTEs excel"
)

parser.add_argument(
    "--locations",
    nargs="*",
    help="A list of your preferred locations"
)

args = parser.parse_args()
path = args.path
locations = args.locations


print(path)
print(locations)

def clean_df(path, sheet_name):
    data =  pd.ExcelFile(path)
    df = data.parse(sheet_name=sheet_name, skiprows=2, ignore_index=True)
    df = df.iloc[:, 1:]
    df.columns = [col for col in df.columns.str.strip().str.lower().str.replace(r'[\'-]', '', regex=True).str.replace(r'[\s+()/]', '_', regex=True)]
    df = df.dropna(subset=['expiry_date', 'email_address'])
    # df_2026[['duration', 'duration_unit']] = df_2026['validity'].str.split(expand=True)
    df['contact_person'] = df['contact_person'].str.title()
    df['expiry_year'] = df['expiry_date'].apply(pd.to_datetime, errors='coerce').dt.year
    df['is_valid'] = df['expiry_year'].apply(lambda x: True if x >= datetime.now().year else False)
    df = df[[
        'companys_name',
        'contact_person',
        'position',
        'email_address',
        'address',
        'expiry_date',
        'expiry_year',
        'is_valid'
    ]]
    df = df[df['is_valid'] == True]
    return df

# Check if the cleaned already exists
if "cleaned_htes.csv" in os.listdir("./datasets"):
    df_2526 = pd.read_csv("./datasets/cleaned_htes.csv")
else:
    df_2026 = clean_df(path, "2026")
    df_2025 = clean_df(path, "2025")
    df_2526 = pd.concat([df_2026, df_2025], ignore_index=True)
    df_2526.to_csv("./datasets/cleaned_htes.csv", index=False)

re_key = ""
location_length = len(locations)
if location_length != 0:
    for idx, location in enumerate(locations):
        if idx == location_length - 1:
            re_key = re_key + location
        else:
            re_key = re_key + (location + '|')

print(re_key)
df_place = df_2526[df_2526['address'].str.contains(re_key, case=False, na=False)]

file_name = re_key.replace('|', '_')
df_place.to_csv(f"./datasets/cleaned_htes_{file_name}.csv", index=False)




