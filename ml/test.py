from inference import analyze_url
import pprint

test_urls = [
    "https://google.com",
    "http://free-gift-card-win-now.xyz",
    "http://paypal.com.secure-login.tk/verify"
]

for url in test_urls:
    print(f"\n--- Testing: {url} ---")
    result = analyze_url(url)
    pprint.pprint(result)
