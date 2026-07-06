' Double-click this file to copy site files and push to GitHub
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "C:\Users\Administrator\Atrovia.co-site"
sh.Run "powershell -NoProfile -ExecutionPolicy Bypass -File ""C:\Users\Administrator\Atrovia.co-site\scripts\deploy-now.ps1""", 1, True
MsgBox "Deploy finished. Check C:\Users\Administrator\atrovia_deploy_full_output.txt for details.", vbInformation, "Atrovia GitHub Upload"