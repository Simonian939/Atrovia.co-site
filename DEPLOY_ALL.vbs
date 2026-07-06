' One-click: copy Austin HTML → GitHub → Vercel production
' Vercel project: https://vercel.com/atrovia-landing-page/atrovia
Option Explicit
Dim sh, fso, repo, log, psCmd, txt, ts
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
repo = "C:\Users\Administrator\Atrovia.co-site"
log = "C:\Users\Administrator\atrovia_deploy_full_output.txt"

psCmd = "powershell -NoProfile -ExecutionPolicy Bypass -File """ & repo & "\scripts\deploy-now.ps1"""
sh.CurrentDirectory = repo
sh.Run psCmd, 1, True

If Not fso.FileExists(log) Then
    MsgBox "Deploy log not found. Run PowerShell manually:" & vbCrLf & psCmd, vbCritical, "Atrovia Deploy"
    WScript.Quit 1
End If

Set ts = fso.OpenTextFile(log, 1)
txt = ts.ReadAll
ts.Close

If InStr(txt, "git push exit code: 0") > 0 And InStr(txt, "vercel deploy exit code: 0") > 0 Then
    MsgBox "SUCCESS!" & vbCrLf & vbCrLf & "GitHub: https://github.com/mrcarter67/Atrovia.co-site" & vbCrLf & "Vercel: https://atrovia.vercel.app" & vbCrLf & "Dashboard: https://vercel.com/atrovia-landing-page/atrovia", vbInformation, "Atrovia Deploy"
ElseIf InStr(txt, "git push exit code: 0") > 0 Then
    MsgBox "GitHub push OK. Vercel step may need login." & vbCrLf & vbCrLf & "Run in PowerShell:" & vbCrLf & "vercel login" & vbCrLf & "cd " & repo & vbCrLf & "vercel link --project atrovia --scope atrovia-landing-page" & vbCrLf & "vercel --prod", vbExclamation, "Atrovia Deploy"
Else
    MsgBox "Deploy had errors. Open log:" & vbCrLf & log, vbExclamation, "Atrovia Deploy"
End If