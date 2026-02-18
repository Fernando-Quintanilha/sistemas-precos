import firebase_admin
from firebase_admin import credentials, firestore
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from google.cloud.firestore_v1.base_query import FieldFilter
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# 1. Conexão Firebase
cred = credentials.Certificate("chave-firebase.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 2. Configuração do Navegador
def iniciar_driver():
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Descomente para rodar sem abrir a janela
    return webdriver.Chrome(service=service, options=options)

print("🔥 Conexão estabelecida! Aguardando novos jobs...")

# 3. Teste de Busca Simples
def buscar_preco_ml(produto_nome):
    driver = iniciar_driver()
    try:
        # Limpa o texto "Exemplo:" da sua planilha
        termo_busca = produto_nome.replace("Exemplo:", "").strip()
        print(f"🔎 Buscando: {termo_busca}")
        
        url = f"https://lista.mercadolivre.com.br/{termo_busca.replace(' ', '-')}"
        driver.get(url)

        # Espera explícita corrigida:
        wait = WebDriverWait(driver, 10)
        
        seletores = [
            ".poly-price__number", 
            ".ui-search-price__second-line .andes-money-amount__fraction",
            ".price-tag-fraction"
        ]
        
        preco = "N/A"
        for seletor in seletores:
            try:
                # AQUI ESTAVA O ERRO: Corrigido para EC.presence_of_element_located
                elemento = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, seletor)))
                preco = elemento.text
                if preco: break
            except:
                continue

        print(f"💰 Preço encontrado: R$ {preco}")
        return preco
    except Exception as e:
        print(f"❌ Erro na busca: {e}")
        return "N/A"
    finally:
        driver.quit()

# Execução de teste com o primeiro item pendente que encontrar
query = db.collection('processamentos').where(filter=FieldFilter('status', '==', 'pendente')).limit(1)
docs = query.stream()

for doc in docs:
    dados = doc.to_dict()
    skus = dados.get('skus', [])
    
    if skus:
        # Pega o primeiro item e garante que ele não é None
        primeiro_item_dict = skus[0]
        nome_produto = primeiro_item_dict.get('Produto')
        
        if nome_produto:
            print(f"✅ Item identificado: {nome_produto}")
            buscar_preco_ml(nome_produto)
        else:
            print(f"⚠️ Alerta: O campo 'Produto' está vazio no documento {doc.id}")
    else:
        print(f"📂 O documento {doc.id} não possui uma lista de SKUs.")
    