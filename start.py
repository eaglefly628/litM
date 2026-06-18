#!/usr/bin/env python3
"""
小源养成记 - 启动脚本
自动安装依赖并启动服务器，启动后自动打开浏览器
"""

import subprocess
import sys
import os
import time
import webbrowser
import signal
import platform

PORT = int(os.environ.get('PORT', 3000))
HOST = os.environ.get('HOST', 'localhost')
DIR = os.path.dirname(os.path.abspath(__file__))

def check_node():
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()
        print(f'✅ Node.js {version}')
        return True
    except FileNotFoundError:
        print('❌ 未找到 Node.js，请先安装: https://nodejs.org/')
        return False

def install_deps():
    node_modules = os.path.join(DIR, 'node_modules')
    if os.path.isdir(node_modules):
        print('✅ 依赖已安装')
        return True

    print('📦 安装依赖中...')
    result = subprocess.run(['npm', 'install'], cwd=DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'❌ 安装失败:\n{result.stderr}')
        return False
    print('✅ 依赖安装完成')
    return True

def open_browser():
    time.sleep(1.5)
    url = f'http://{HOST}:{PORT}'
    print(f'🌐 打开浏览器: {url}')
    webbrowser.open(url)

def start_server():
    url = f'http://{HOST}:{PORT}'
    print(f'\n🐶 小源养成记')
    print(f'━━━━━━━━━━━━━━━━━━━━━━━━')
    print(f'   地址: {url}')
    print(f'   按 Ctrl+C 停止服务器')
    print(f'━━━━━━━━━━━━━━━━━━━━━━━━\n')

    env = os.environ.copy()
    env['PORT'] = str(PORT)

    # 在新线程中打开浏览器
    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        process = subprocess.Popen(
            ['node', 'server.js'],
            cwd=DIR,
            env=env,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        process.wait()
    except KeyboardInterrupt:
        print('\n\n👋 服务器已停止')
        process.terminate()
        process.wait()

def main():
    print('🐶 小源养成记 - 启动中...\n')

    if not check_node():
        sys.exit(1)

    if not install_deps():
        sys.exit(1)

    start_server()

if __name__ == '__main__':
    main()
