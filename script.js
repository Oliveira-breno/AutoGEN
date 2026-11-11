let textareaKeys = document.querySelector("#geminiApiKeys");
let selectMarca = document.querySelector("#marca");
let selectModelo = document.querySelector("#modelo");
let selectAno = document.querySelector("#ano");
let botaoEnter = document.querySelector("#botaoEnter");
let conteudo = document.querySelector("#conteudo");

const FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros";

async function carregarMarcas() {
    try {
        const res = await fetch(`${FIPE_BASE_URL}/marcas`);
        const marcas = await res.json();
        selectMarca.innerHTML = '<option value="">Selecione a Marca</option>' + 
            marcas.map(m => `<option value="${m.codigo}">${m.nome}</option>`).join('');
    } catch(e) {
        selectMarca.innerHTML = '<option value="">Erro ao carregar marcas</option>';
    }
}
carregarMarcas();

selectMarca.addEventListener('change', async () => {
    selectModelo.innerHTML = '<option value="">Carregando...</option>';
    selectModelo.disabled = true;
    selectAno.innerHTML = '<option value="">Selecione o Modelo primeiro</option>';
    selectAno.disabled = true;
    botaoEnter.disabled = true;
    
    if(!selectMarca.value) return;

    const res = await fetch(`${FIPE_BASE_URL}/marcas/${selectMarca.value}/modelos`);
    const dados = await res.json();
    selectModelo.innerHTML = '<option value="">Selecione o Modelo</option>' + 
        dados.modelos.map(m => `<option value="${m.codigo}">${m.nome}</option>`).join('');
    selectModelo.disabled = false;
});

selectModelo.addEventListener('change', async () => {
    selectAno.innerHTML = '<option value="">Carregando...</option>';
    selectAno.disabled = true;
    botaoEnter.disabled = true;

    if(!selectModelo.value) return;

    const res = await fetch(`${FIPE_BASE_URL}/marcas/${selectMarca.value}/modelos/${selectModelo.value}/anos`);
    const anos = await res.json();
    selectAno.innerHTML = '<option value="">Selecione o Ano</option>' + 
        anos.map(a => `<option value="${a.codigo}">${a.nome}</option>`).join('');
    selectAno.disabled = false;
});

selectAno.addEventListener('change', () => {
    botaoEnter.disabled = !selectAno.value;
});

botaoEnter.addEventListener('click', inicio);

async function inicio() {
    let keys = textareaKeys.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);

    let marcaNome = selectMarca.options[selectMarca.selectedIndex].text;
    let modeloNome = selectModelo.options[selectModelo.selectedIndex].text;
    let anoNome = selectAno.options[selectAno.selectedIndex].text;

    let modeloTratado = modeloNome.split(' ').slice(0, 2).join(' ').replace(/\//g, '').trim(); 

    let anoTratado = anoNome.split(' ')[0];

    if (keys.length === 0) {
        conteudo.innerHTML = `<p style="color:red;"> Insira pelo menos uma Chave de API!</p>`;
        return;
    }

    conteudo.innerHTML = "<p>Buscando dados oficiais na FIPE...</p>";

    try {
        const resFipe = await fetch(`${FIPE_BASE_URL}/marcas/${selectMarca.value}/modelos/${selectModelo.value}/anos/${selectAno.value}`);
        const fipeData = await resFipe.json();

        conteudo.innerHTML = "<p>Realizando Web Scraping na OLX...</p>";
        let olxData = [];
        
        try {
            const urlFlask = `http://127.0.0.1:8000/api/anuncios/${encodeURIComponent(marcaNome)}/${encodeURIComponent(modeloTratado)}/${encodeURIComponent(anoTratado)}`;
            const resOLX = await fetch(urlFlask);
            
            if (!resOLX.ok) {
                throw new Error(`Status: ${resOLX.status}`);
            }
            
            olxData = await resOLX.json();
        } catch(e) {
            console.error("Erro na API Flask:", e);
            conteudo.innerHTML = `<p style="color:red;"> Falha ao conectar com o Web Scraping local. Verifique se o Api.py está rodando.</p>`;
            return;
        }

        conteudo.innerHTML = "<p>Analisando dados com IA (Testando chaves API)...</p>";
        await chamarGeminiComRodizio(keys, fipeData, olxData, marcaNome, modeloNome);

    } catch (error) {
        console.error(error);
        conteudo.innerHTML = `<p style="color:red;">Erro fatal: ${error.message}</p>`;
    }
}

async function chamarGeminiComRodizio(keys, fipeData, olxData, marca, modelo) {
    const MODEL = 'gemini-3.5-flash-lite'; 
    
    const textoAnuncios = olxData.length > 0 ? JSON.stringify(olxData) : "Nenhum anúncio ativo foi encontrado no momento para este modelo/ano.";

    const prompt = `Você é um especialista automotivo.
        Avalie o carro ${marca} ${modelo} baseado na Tabela FIPE: ${JSON.stringify(fipeData)} 
        e nestes anúncios de mercado (OLX): ${textoAnuncios}.
        
        Nota: Caso não haja anúncios disponíveis, baseie sua análise na Tabela FIPE e no histórico conhecido do veículo no mercado brasileiro.
        
        Retorne ESTRITAMENTE um objeto JSON com esta estrutura:
        {
            "resumo": "Breve análise do carro no mercado",
            "custo_beneficio": "Bom" ou "Ruim",
            "pontos_importantes": ["ponto 1", "ponto 2", "ponto 3"],
            "alternativas": [
                {"modelo": "carro x", "vantagens": "...", "desvantagens": "..."}
            ]
        }`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
    };

    let sucesso = false;
    let ultimoErro = "";

    for (let i = 0; i < keys.length; i++) {
        let apiKey = keys[i];
        
        if (apiKey.length < 25) {
            ultimoErro = `Chave ${i + 1} ignorada (tamanho/formato inválido).`;
            continue; 
        }

        let url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
        
        conteudo.innerHTML = `<p>Analisando dados com IA (Testando chave ${i + 1} de ${keys.length})...</p>`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const erroDetalhado = await response.text();
                throw new Error(`Chave ${i + 1} recusada (Status ${response.status})`);
            }

            const data = await response.json();
            const geminiResposta = JSON.parse(data.candidates[0].content.parts[0].text);
            
            renderizarInterface(geminiResposta, olxData, fipeData);
            sucesso = true;
            break; 
            
        } catch (error) {
            ultimoErro = error.message;
        }
    }
    if (!sucesso) {
        throw new Error(`Todas as chaves inseridas falharam. Motivo da última tentativa: ${ultimoErro}`);
    }
}

function renderizarInterface(dadosGemini, olxData, fipeData) {
    let corIndicador = dadosGemini.custo_beneficio.toLowerCase() === 'bom' ? 'green' : 'red';

    let secaoAnuncios = "";
    if (olxData.length > 0) {
        secaoAnuncios = `
            <table border="1" width="100%" style="border-collapse: collapse; text-align: left; margin-bottom: 20px;">
                <tr style="background-color: #eee;">
                    <th style="padding: 8px;">Preço</th>
                    <th style="padding: 8px;">Quilometragem</th>
                    <th style="padding: 8px;">Link</th>
                </tr>
                ${olxData.map(a => `
                    <tr>
                        <td style="padding: 8px;">${a.preco}</td>
                        <td style="padding: 8px;">${a.km}</td>
                        <td style="padding: 8px;"><a href="${a.link}" target="_blank">Ver Anúncio</a></td>
                    </tr>
                `).join('')}
            </table>
        `;
    } else {
        secaoAnuncios = `
            <div style="background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                ⚠️ Nenhuma oferta ativa encontrada na OLX para este ano/modelo no momento. A análise foi realizada com base na FIPE e no histórico do veículo.
            </div>
        `;
    }

    let html = `
        <div style="border: 2px solid ${corIndicador}; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
            <h2 style="margin-top:0;">Custo-Benefício: <span style="color: ${corIndicador}">${dadosGemini.custo_beneficio}</span></h2>
            <p><strong>Fipe Oficial:</strong> ${fipeData.Valor}</p>
            <p><strong>Resumo do Especialista:</strong> ${dadosGemini.resumo}</p>
        </div>

        <h3>Pontos Importantes</h3>
        <ul>${dadosGemini.pontos_importantes.map(p => `<li>${p}</li>`).join('')}</ul>

        <h3>Anúncios Encontrados na OLX</h3>
        ${secaoAnuncios}

        <h3>Alternativas (Faixa de Preço)</h3>
        <div class="alternativas-container">
            ${dadosGemini.alternativas.map(alt => `
                <div class="alternativa-card">
                    <h4>${alt.modelo}</h4>
                    <p>✅ <strong>Pró:</strong> ${alt.vantagens}</p>
                    <p>❌ <strong>Contra:</strong> ${alt.desvantagens}</p>
                </div>
            `).join('')}
        </div>
    `;

    conteudo.innerHTML = html;

    setTimeout(() => {
        conteudo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    conteudo.innerHTML = html;
}