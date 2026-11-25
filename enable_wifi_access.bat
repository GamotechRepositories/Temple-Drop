@echo off
netsh advfirewall firewall add rule name="Temple Drop Client 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Temple Drop Server 5000" dir=in action=allow protocol=TCP localport=5000
powershell -NoProfile -Command "Set-NetConnectionProfile -InterfaceAlias Wi-Fi -NetworkCategory Private"
echo Firewall rules and Private Network set successfully!
