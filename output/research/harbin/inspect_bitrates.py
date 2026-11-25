import urllib.request
import json

url = 'https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id=7585934292711132467&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0'
headers = {'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.load(resp)
video = data['aweme_detail']['video']
play_addr = video.get('play_addr', {})
print("play_addr data_size:", play_addr.get('data_size'))
print("play_addr url_list[0]:", play_addr.get('url_list', [])[0] if play_addr.get('url_list') else None)
