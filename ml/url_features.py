"""
Helper module for URL feature extraction and model loading.
Contains the custom classes needed perfectly deserialize the XGBoost model pipeline.
"""
import math
import re
from collections import Counter
import numpy as np
import joblib
import sys
import os
from scipy.sparse import hstack, csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer

MODEL_PATH = os.path.join(os.path.dirname(__file__), "url_classifier_fixed.pkl")

def load_tranco_top_n(n=100000):
    fallback = [
        'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
        'linkedin.com', 'github.com', 'wikipedia.org', 'amazon.com', 'microsoft.com',
        'apple.com', 'netflix.com', 'reddit.com', 'stackoverflow.com', 'whatsapp.com',
        'tiktok.com', 'bing.com', 'yahoo.com', 'baidu.com', 'zoom.us',
        'dropbox.com', 'spotify.com', 'adobe.com', 'salesforce.com', 'shopify.com',
        'cloudflare.com', 'wordpress.com', 'openai.com', 'anthropic.com', 'stripe.com',
    ]
    return {d: i+1 for i, d in enumerate(fallback)}

TRANCO = load_tranco_top_n(100000)

SUSPICIOUS_TLDS = {
    '.xyz', '.top', '.club', '.online', '.site', '.tk', '.ml',
    '.ga', '.cf', '.gq', '.pw', '.cc', '.info', '.biz', '.ws',
    '.cn', '.ru', '.su', '.to', '.click', '.link', '.download'
}

TRUSTED_TLDS = {'.com', '.org', '.net', '.edu', '.gov', '.io', '.co.uk', '.ac.uk'}

BRAND_KEYWORDS = [
    'paypal', 'apple', 'google', 'amazon', 'microsoft', 'facebook',
    'netflix', 'instagram', 'twitter', 'linkedin', 'bank', 'secure',
    'login', 'signin', 'account', 'verify', 'update', 'confirm',
    'password', 'ebay', 'chase', 'citibank', 'wellsfargo', 'hsbc'
]

def url_entropy(s):
    if not s: return 0
    counts = Counter(s)
    total = len(s)
    return -sum((c/total) * math.log2(c/total) for c in counts.values())

def get_tld(domain):
    parts = domain.rsplit('.', 1)
    return '.' + parts[-1] if len(parts) > 1 else ''

def is_ip_address(domain):
    return bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain))

def normalize_url(url: str) -> str:
    url = url.strip().lower()
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'^www\.', '', url)
    if url.endswith('/') and url.count('/') == 1:
        url = url.rstrip('/')
    return url

def split_url(url: str):
    url = normalize_url(url)
    parts = url.split('/', 1)
    domain = parts[0]
    path   = parts[1] if len(parts) > 1 else ''
    return domain, path

class URLFeatures(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self

    def transform(self, X):
        features = []
        for url in X:
            norm   = normalize_url(url)
            domain, path = split_url(url)
            tld    = get_tld(domain)
            sub_parts = domain.split('.')

            tranco_rank = TRANCO.get(domain, None)
            in_top_1k   = int(tranco_rank is not None and tranco_rank <= 1000)
            in_top_10k  = int(tranco_rank is not None and tranco_rank <= 10000)
            in_top_100k = int(tranco_rank is not None and tranco_rank <= 100000)
            tranco_score = 0 if tranco_rank is None else max(0, 1 - (tranco_rank / 100000))

            full_len    = len(norm)
            domain_len  = len(domain)
            path_len    = len(path)

            subdomain_count = max(0, len(sub_parts) - 2)
            has_many_subs   = int(subdomain_count >= 3)
            has_brand_as_sub = int(any(brand in '.'.join(sub_parts[:-2]) for brand in BRAND_KEYWORDS))

            is_suspicious_tld = int(tld in SUSPICIOUS_TLDS)
            is_trusted_tld    = int(tld in TRUSTED_TLDS)

            dot_count   = norm.count('.')
            dash_count  = norm.count('-')
            slash_count = norm.count('/')
            at_count    = norm.count('@')
            pct_count   = norm.count('%')
            eq_count    = norm.count('=')
            amp_count   = norm.count('&')
            digit_count = sum(c.isdigit() for c in norm)

            digit_ratio  = digit_count / max(full_len, 1)
            alpha_ratio  = sum(c.isalpha() for c in norm) / max(full_len, 1)
            special_ratio = (at_count + pct_count + eq_count) / max(full_len, 1)

            has_ip      = int(is_ip_address(domain))
            has_at      = int('@' in norm)
            double_slash = int('//' in norm[2:])
            has_hex_enc = int('%' in path)

            brand_count = sum(1 for kw in BRAND_KEYWORDS if kw in norm)

            full_entropy   = url_entropy(norm)
            domain_entropy = url_entropy(domain)

            long_url    = int(full_len > 75)
            very_long   = int(full_len > 150)

            features.append([
                in_top_1k, in_top_10k, in_top_100k, tranco_score,
                domain_len, subdomain_count, has_many_subs, has_brand_as_sub,
                is_suspicious_tld, is_trusted_tld,
                full_len, path_len, long_url, very_long,
                dot_count, dash_count, slash_count, at_count,
                pct_count, eq_count, amp_count, digit_count,
                digit_ratio, alpha_ratio, special_ratio,
                has_ip, has_at, double_slash, has_hex_enc,
                brand_count, full_entropy, domain_entropy,
            ])

        return np.array(features, dtype=np.float32)

class CombinedFeatures(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.tfidf_domain = TfidfVectorizer(
            analyzer='char_wb', ngram_range=(3, 5),
            max_features=8000, sublinear_tf=True
        )
        self.tfidf_path = TfidfVectorizer(
            analyzer='char_wb', ngram_range=(3, 5),
            max_features=4000, sublinear_tf=True
        )
        self.url_features = URLFeatures()

    def fit(self, X, y=None):
        domains = [split_url(u)[0] for u in X]
        paths   = [split_url(u)[1] for u in X]
        self.tfidf_domain.fit(domains)
        self.tfidf_path.fit(paths)
        return self

    def transform(self, X):
        domains = [split_url(u)[0] for u in X]
        paths   = [split_url(u)[1] for u in X]

        f_domain  = self.tfidf_domain.transform(domains)
        f_path    = self.tfidf_path.transform(paths)
        f_manual  = csr_matrix(self.url_features.transform(X))

        return hstack([f_domain, f_path, f_manual])

# Map to __main__ so joblib doesn't throw ModuleNotFoundError during load
sys.modules['__main__'].URLFeatures = URLFeatures
sys.modules['__main__'].CombinedFeatures = CombinedFeatures
sys.modules['__main__'].normalize_url = normalize_url
sys.modules['__main__'].split_url = split_url

_url_model_data = None

def get_url_model():
    global _url_model_data
    if _url_model_data is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Missing URL classifier model: {MODEL_PATH}")
        _url_model_data = joblib.load(MODEL_PATH)
    return _url_model_data
