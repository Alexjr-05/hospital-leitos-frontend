const API_URL = 'https://hospital-leitos-1.onrender.com'

/* ── ALERTAS ─────────────────────────────────────── */
async function buscarAlertas() {
    try {
        const res = await fetch(`${API_URL}/relatorios/alertas`)
        if (!res.ok) return
        const { alertas } = await res.json()

        const section = document.getElementById('alertas-section')
        section.innerHTML = ''

        if (alertas.length === 0) {
            section.style.display = 'none'
            return
        }

        section.style.display = 'block'
        alertas.forEach(a => {
            const div = document.createElement('div')
            div.className = `alerta alerta-${a.nivel}`
            const icone = a.nivel === 'danger' ? '🚨' : '⚠️'
            const span = document.createElement('span')
            span.className = 'alerta-icone'
            span.textContent = icone
            const txt = document.createElement('span')
            txt.textContent = a.mensagem
            div.append(span, txt)
            section.appendChild(div)
        })
    } catch {
        // Sem alertas no ar — não bloqueia o resto da página
    }
}

/* ── KPIs ────────────────────────────────────────── */
async function buscarKPIs() {
    try {
        const res = await fetch(`${API_URL}/relatorios/kpis`)
        if (!res.ok) return
        const kpi = await res.json()

        document.getElementById('kpi-total').textContent        = kpi.total         ?? '—'
        document.getElementById('kpi-ocupados').textContent     = kpi.ocupados       ?? '—'
        document.getElementById('kpi-disponiveis').textContent  = kpi.disponiveis    ?? '—'
        document.getElementById('kpi-higienizacao').textContent = kpi.em_higienizacao ?? '—'
        document.getElementById('kpi-reservados').textContent   = kpi.reservados     ?? '—'
        document.getElementById('kpi-bloqueados').textContent   = kpi.bloqueados     ?? '—'
    } catch {
        // Silencia — dados ficam como "—"
    }
}

/* ── MAPA DE LEITOS ──────────────────────────────── */
const STATUS_CLASSES = {
    'ocupado':      'status-ocupado',
    'disponível':   'status-disponivel',
    'higienização': 'status-higienizacao',
    'reservado':    'status-reservado',
    'bloqueado':    'status-bloqueado',
    'alta prevista':'status-alta',
    'limpeza':      'status-limpeza',
}

async function buscarLeitos() {
    const tabela = document.getElementById('tabela-leitos')
    try {
        const res = await fetch(`${API_URL}/leitos`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const dados = await res.json()

        tabela.innerHTML = ''

        dados.forEach(leito => {
            const classeStatus = STATUS_CLASSES[leito.status.toLowerCase().trim()] || ''

            const tr = document.createElement('tr')

            const cells = [
                leito.numero,
                leito.setor,
                null,               // status (com classe)
                leito.paciente || '—',
                leito.convenio || '—',
            ]

            cells.forEach((val, idx) => {
                const td = document.createElement('td')
                if (idx === 2) {
                    td.className = classeStatus
                    td.textContent = leito.status
                } else {
                    td.textContent = val
                }
                tr.appendChild(td)
            })

            tabela.appendChild(tr)
        })

        const hora = new Date().toLocaleTimeString('pt-BR')
        const el = document.getElementById('ultima-atualizacao')
        if (el) el.textContent = `Atualizado às ${hora}`

    } catch {
        tabela.innerHTML = ''
        const tr = document.createElement('tr')
        const td = document.createElement('td')
        td.colSpan = 5
        td.textContent = 'Erro ao carregar dados. Verifique a conexão com o servidor.'
        td.style.cssText = 'text-align:center; color:#ef4444; padding:24px;'
        tr.appendChild(td)
        tabela.appendChild(tr)
    }
}

/* ── ATUALIZAÇÃO UNIFICADA ───────────────────────── */
function atualizarDashboard() {
    buscarAlertas()
    buscarKPIs()
    buscarLeitos()
}

atualizarDashboard()
const intervaloId = setInterval(atualizarDashboard, 10000)
window.addEventListener('beforeunload', () => clearInterval(intervaloId))
