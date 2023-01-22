import os
import shutil

for x in os.listdir():
    shutil.move(x, x.replace('pc', ''))
    
