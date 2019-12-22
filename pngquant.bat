set dir=%~d0%~p0
set target=%dir%\assets
for /r %target% %%i in (*.png) do %dir%pngquant.exe --force --verbose --output %%i --skip-if-larger 256 %%i
pause