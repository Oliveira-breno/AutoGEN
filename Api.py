from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import time

app = Flask(__name__)
CORS(app)

@app.route('/api/anuncios/<marca>/<modelo>/<ano>', methods=['GET'])
def buscar_anuncios(marca, modelo, ano):
    marca_limpa = marca.split('-')[-1].strip().lower().replace(" ", "+")
    modelo_limpo = modelo.split('-')[-1].strip().lower().replace(" ", "+")
    
    termo_busca = f"{marca_limpa}+{modelo_limpo}+{ano}"
    url = f"https://www.olx.com.br/estado-mg/autos-e-pecas/carros-vans-e-utilitarios?q={termo_busca}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Platform': '"Windows"'
    }
    
    anuncios = []
    max_tentativas = 3 
    
    for tentativa in range(max_tentativas):
        try:
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                links = soup.find_all('a', href=re.compile(r'olx\.com\.br/.+/autos-e-pecas/carros-vans-e-utilitarios/'))
                
                if not links:
                    print(f"Tentativa {tentativa + 1}: Bloqueado pelo anti-bot. Tentando novamente...")
                    time.sleep(2) 
                    continue 

                links_processados = set()
                
                for link in links:
                    if len(anuncios) >= 5:
                        break
                        
                    href = link.get('href', '')
                    href_limpo = href.split('?')[0]
                    
                    if href_limpo in links_processados:
                        continue
                        
                    texto_card = link.get_text(separator=' ')
                    if "R$" not in texto_card and link.parent:
                        texto_card = link.parent.get_text(separator=' ')
                        if "R$" not in texto_card and link.parent.parent:
                            texto_card = link.parent.parent.get_text(separator=' ')
                    
                    preco_match = re.search(r'R\$\s*([\d\.]+)', texto_card)
                    km_match = re.search(r'([\d\.]+)\s*[kK][mM]', texto_card)
                    
                    if preco_match:
                        valor_str = preco_match.group(1)
                        try:
                            if int(valor_str.replace('.', '')) < 3000:
                                continue
                        except:
                            continue
                            
                        links_processados.add(href_limpo)
                        km_str = km_match.group(0).strip() if km_match else "Não informado"
                        
                        anuncios.append({
                            "preco": f"R$ {valor_str}",
                            "km": km_str,
                            "link": href_limpo
                        })
                        

                if anuncios:
                    return jsonify(anuncios)

        except requests.exceptions.RequestException as e:

            print(f"Tentativa {tentativa + 1} falhou por erro de rede: {e}")
            time.sleep(2)

    print("Todas as tentativas de scraping falharam.")
    return jsonify([])

if __name__ == '__main__':
    app.run(port=8000, debug=True)