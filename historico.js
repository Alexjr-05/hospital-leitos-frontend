const API_URL = 'https://hospital-leitos-1.onrender.com'

const BADGE_CLASSES = {
    'Internação':             'badge-internacao',
    'Alta':                   'badge-alta',
    'Transferência Saída':    'badge-transferencia',
    'Transferência Entrada':  'badge-transferencia',
    'Reserva':                'badge-reserva',
    'Reserva Cancelada':      'badge-reserva',
    'Reserva Convertida':     'badge-reserva',
    'Bloqueio':               'badge-bloqueio',
    'Desbloqueio':            'badge-bloqueio',
    'Higienização Iniciada':  'badge-higienizacao',
    'Higienização Concluída': 'badge-higienizacao',
}

function formatarDataHora(isoStr) {
    if (!isoStr) return '—'
    return new Date(isoStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

async function buscarHistorico() {
    const dataInicio = document.getElementById('filtroDataInicio').value
    const dataFim    = document.getElementById('filtroDataFim').value
    const acao       = document.getElementById('filtroAcao').value

    const params = new URLSearchParams()
    if (dataInicio) params.append('data_inicio', dataInicio)
    if (dataFim)    params.append('data_fim',    dataFim)
    if (acao)       params.append('acao',        acao)
    params.append('limit', '500')

    const tabela   = document.getElementById('tabela-historico')
    const contador = document.getElementById('contadorHistorico')

    tabela.innerHTML = ''
    contador.textContent = 'Carregando...'

    try {
        const res = await fetch(`${API_URL}/historico?${params}`)
        if (!res.ok) throw new Error()
        const dados = await res.json()

        if (dados.length === 0) {
            const tr = document.createElement('tr')
            const td = document.createElement('td')
            td.colSpan = 6
            td.textContent = 'Nenhum registro encontrado para os filtros selecionados.'
            td.style.cssText = 'text-align:center; color:#6b7280; padding:24px;'
            tr.appendChild(td)
            tabela.appendChild(tr)
            contador.textContent = '0 registros'
            return
        }

        dados.forEach(h => {
            const tr = document.createElement('tr')

            const tdData = document.createElement('td')
            tdData.textContent = formatarDataHora(h.created_at)
            tdData.style.whiteSpace = 'nowrap'

            const tdLeito = document.createElement('td')
            tdLeito.textContent = `Leito ${h.leito_numero}`

            const tdSetor = document.createElement('td')
            tdSetor.textContent = h.setor || '—'

            const tdPaciente = document.createElement('td')
            tdPaciente.textContent = h.paciente_nome || '—'

            const tdAcao = document.createElement('td')
            const badge = document.createElement('span')
            badge.className = `badge ${BADGE_CLASSES[h.acao] || 'badge-bloqueio'}`
            badge.textContent = h.acao
            tdAcao.appendChild(badge)

            const tdDesc = document.createElement('td')
            tdDesc.textContent = h.descricao || '—'
            tdDesc.style.cssText = 'font-size:13px; color:#9ca3af; max-width:300px;'

            tr.append(tdData, tdLeito, tdSetor, tdPaciente, tdAcao, tdDesc)
            tabela.appendChild(tr)
        })

        contador.textContent = `${dados.length} registro${dados.length !== 1 ? 's' : ''}`

    } catch {
        const tr = document.createElement('tr')
        const td = document.createElement('td')
        td.colSpan = 6
        td.textContent = 'Erro ao carregar histórico. Verifique a conexão com o servidor.'
        td.style.cssText = 'text-align:center; color:#ef4444; padding:24px;'
        tr.appendChild(td)
        tabela.appendChild(tr)
        contador.textContent = ''
    }
}

document.getElementById('btnFiltrar').addEventListener('click', buscarHistorico)

document.getElementById('btnLimpar').addEventListener('click', () => {
    document.getElementById('filtroDataInicio').value = ''
    document.getElementById('filtroDataFim').value    = ''
    document.getElementById('filtroAcao').value       = ''
    buscarHistorico()
})

// Permite aplicar filtro com Enter nos campos de data
document.querySelectorAll('#filtroDataInicio, #filtroDataFim').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') buscarHistorico() })
})

buscarHistorico()
