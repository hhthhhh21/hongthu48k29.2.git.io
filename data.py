import pandas as pd
import json

file="D:\dueTQHDL\D3\data_ggsheet.xlsx"
df= pd.read_excel(file,sheet_name=0)
djson=df.to_json(orient="records",force_ascii=False, indent=4)
ouput = output_file = "assets/data.json"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(djson)

print(f"✅ File JSON đã được tạo: {output_file}")