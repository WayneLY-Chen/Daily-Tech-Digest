:: -*- coding: big5 -*-
@echo off
title Daily Tech Digest - System Starter
echo ==========================================
echo   Step 1: 正在抓取最新技術資料...
echo ==========================================
call node src/index.js

echo.
echo ==========================================
echo   Step 2: 資料抓取完成！正在啟動前端伺服器...
echo ==========================================
echo   (這會開啟一個新視窗來運行網頁程式)
echo ==========================================

cd frontend
start "Daily Tech Digest - Frontend" cmd /k "npm run dev"

echo.
echo ------------------------------------------
echo   系統啟動程序已完成。
echo   1. 請在另一個視窗查看網頁進度。
echo   2. 完成後請訪問: http://localhost:5173
echo ------------------------------------------
pause