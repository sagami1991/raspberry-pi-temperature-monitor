# coding:utf-8
import smbus
import time
 
i2c = smbus.SMBus(1)
address = 0x5c
 
# センサsleep解除
try:
    i2c.write_i2c_block_data(address,0x00,[])
except:
    pass
# 読み取り命令
time.sleep(0.003)
i2c.write_i2c_block_data(address,0x03,[0x00,0x04])
 
# データ受取
time.sleep(0.015)
block = i2c.read_i2c_block_data(address,0,6)
hum = float(block[2] << 8 | block[3])/10
tmp = float(block[4] << 8 | block[5])/10
 
print("{{ \"temperature\": {0}, \"humidity\": {1} }}".format(tmp, hum))
