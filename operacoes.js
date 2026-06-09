const API_URL = 'http://localhost:3000'

/* ══════════════════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════════════════ */

function feedback(id, msg, tipo) {
    const el = document.getElementById(id)
    if (!el) return
    el.textContent = msg
    el.className = `feedback feedback-${tipo}`
    el.style.display = 'block'
    setTimeout(() => { el.style.display = 'none' }, 5000)
}

function setLoading(btnId, loading, textoOriginal, textoLoading) {
    const btn = document.getElementById(btnId)
    if (!btn) return
    btn.disabled = loading
    btn.textContent = loading ? textoLoading : textoOriginal
}

function popularSelect(selectId, opcoes, textoVazio) {
    const sel = document.getElementById(selectId)
    if (!sel) return
    const primeira = sel.options[0]
    sel.innerHTML = ''
    sel.appendChild(primeira)
    if (primeira) primeira.textContent = textoVazio || primeira.textContent
    opcoes.forEach(op => {
        const opt = document.createElement('option')
        opt.value = op.value
        opt.textContent = op.label
        sel.appendChild(opt)
    })
}

function formatarData(isoStr) {
    if (!isoStr) return '—'
    return new Date(isoStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/* ══════════════════════════════════════════════════
   CARREGADORES DE SELECTS
══════════════════════════════════════════════════ */

async function carregarLeitosInternaveis() {
    try {
        const res = await fetch(`${API_URL}/leitos/internaveis`)
        const leitos = await res.json()
        popularSelect('leitoInternacao',
            leitos.map(l => ({ value: l.id, label: `Leito ${l.numero}${l.status === 'Reservado' ? ' (Reservado)' : ''}` })),
            'Selecione o leito'
        )
    } catch { /* silencioso */ }
}

async function carregarLeitosOcupados(selectId) {
    try {
        const res = await fetch(`${API_URL}/leitos/ocupados`)
        const leitos = await res.json()
        popularSelect(selectId,
            leitos.map(l => ({ value: l.id, label: `Leito ${l.numero} — ${l.paciente || 'sem paciente'} (${l.setor})` })),
            'Selecione o leito'
        )
    } catch { /* silencioso */ }
}

async function carregarLeitosDisponiveis(selectId) {
    try {
        const res = await fetch(`${API_URL}/leitos/disponiveis`)
        const leitos = await res.json()
        popularSelect(selectId,
            leitos.map(l => ({ value: l.id, label: `Leito ${l.numero}` })),
            'Selecione o leito'
        )
    } catch { /* silencioso */ }
}

async function carregarLeitosEmHigienizacao() {
    try {
        const res = await fetch(`${API_URL}/leitos/em-higienizacao`)
        const leitos = await res.json()
        popularSelect('leitoHigienizacao',
            leitos.map(l => ({ value: l.id, label: `Leito ${l.numero}` })),
            'Selecione o leito'
        )
    } catch { /* silencioso */ }
}

/* ══════════════════════════════════════════════════
   CARREGADORES DE LISTAS
══════════════════════════════════════════════════ */

async function carregarHigienizacoesAtivas() {
    const container = document.getElementById('listaHigienizacoes')
    try {
        const res = await fetch(`${API_URL}/higienizacoes/ativas`)
        const items = await res.json()

        container.innerHTML = ''
        if (items.length === 0) {
            container.innerHTML = '<p class="registro-vazio">Nenhuma higienização em andamento.</p>'
            return
        }

        items.forEach(h => {
            const div = document.createElement('div')
            div.className = 'registro-item'
            div.innerHTML = `
                <div class="registro-info">
                    <strong>Leito ${h.leito_numero} — ${h.setor}</strong>
                    <span>Responsável: ${h.responsavel}</span>
                    <span>Início: ${formatarData(h.inicio)} · ${h.minutos_em_andamento} min em andamento</span>
                </div>
            `
            const btn = document.createElement('button')
            btn.className = 'btn-primario'
            btn.textContent = 'Concluir'
            btn.addEventListener('click', () => concluirHigienizacao(h.id, btn))
            div.appendChild(btn)
            container.appendChild(div)
        })
    } catch {
        container.innerHTML = '<p class="registro-vazio" style="color:#f87171">Erro ao carregar higienizações.</p>'
    }
}

async function carregarReservasAtivas() {
    const container = document.getElementById('listaReservas')
    try {
        const res = await fetch(`${API_URL}/reservas/ativas`)
        const items = await res.json()

        container.innerHTML = ''
        if (items.length === 0) {
            container.innerHTML = '<p class="registro-vazio">Nenhuma reserva ativa.</p>'
            return
        }

        items.forEach(r => {
            const div = document.createElement('div')
            div.className = 'registro-item'
            div.innerHTML = `
                <div class="registro-info">
                    <strong>Leito ${r.leito_numero} — ${r.setor}</strong>
                    <span>Paciente: ${r.nome_paciente}${r.convenio ? ' · ' + r.convenio : ''}</span>
                    <span>Previsão entrada: ${formatarData(r.previsao_entrada)} · Reservado em: ${formatarData(r.created_at)}</span>
                </div>
            `
            const btn = document.createElement('button')
            btn.className = 'btn-perigo'
            btn.textContent = 'Cancelar Reserva'
            btn.addEventListener('click', () => cancelarReserva(r.id, btn))
            div.appendChild(btn)
            container.appendChild(div)
        })
    } catch {
        container.innerHTML = '<p class="registro-vazio" style="color:#f87171">Erro ao carregar reservas.</p>'
    }
}

async function carregarBloqueiosAtivos() {
    const container = document.getElementById('listaBloqueios')
    try {
        const res = await fetch(`${API_URL}/bloqueios/ativos`)
        const items = await res.json()

        container.innerHTML = ''
        if (items.length === 0) {
            container.innerHTML = '<p class="registro-vazio">Nenhum leito bloqueado.</p>'
            return
        }

        items.forEach(b => {
            const div = document.createElement('div')
            div.className = 'registro-item'
            div.innerHTML = `
                <div class="registro-info">
                    <strong>Leito ${b.leito_numero} — ${b.setor}</strong>
                    <span>Motivo: ${b.motivo}${b.descricao ? ' — ' + b.descricao : ''}</span>
                    <span>Responsável: ${b.responsavel} · Desde: ${formatarData(b.inicio)}</span>
                </div>
            `
            const btn = document.createElement('button')
            btn.className = 'btn-primario'
            btn.textContent = 'Desbloquear'
            btn.addEventListener('click', () => desbloquear(b.id, btn))
            div.appendChild(btn)
            container.appendChild(div)
        })
    } catch {
        container.innerHTML = '<p class="registro-vazio" style="color:#f87171">Erro ao carregar bloqueios.</p>'
    }
}

/* ══════════════════════════════════════════════════
   TROCA DE ABAS
══════════════════════════════════════════════════ */

const CARGA_POR_ABA = {
    internacao:    () => carregarLeitosInternaveis(),
    alta:          () => carregarLeitosOcupados('leitoAlta'),
    higienizacao:  () => { carregarLeitosEmHigienizacao(); carregarHigienizacoesAtivas() },
    transferencia: () => { carregarLeitosOcupados('leitoOrigem'); carregarLeitosDisponiveis('leitoDestino') },
    reserva:       () => { carregarLeitosDisponiveis('leitoReserva'); carregarReservasAtivas() },
    bloqueio:      () => { carregarLeitosDisponiveis('leitoBloqueio'); carregarBloqueiosAtivos() },
}

document.querySelectorAll('.aba').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'))
        document.querySelectorAll('.painel-aba').forEach(p => p.classList.remove('ativo'))
        btn.classList.add('ativa')
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('ativo')
        CARGA_POR_ABA[btn.dataset.tab]?.()
    })
})

// Carrega aba inicial
CARGA_POR_ABA.internacao()

/* ══════════════════════════════════════════════════
   INTERNAÇÃO
══════════════════════════════════════════════════ */

document.getElementById('btnInternar').addEventListener('click', async () => {
    const nome             = document.getElementById('nome').value.trim()
    const prontuario       = document.getElementById('prontuario').value.trim()
    const data_nascimento  = document.getElementById('dataNascimento').value
    const convenio         = document.getElementById('convenio').value.trim()
    const medico_responsavel = document.getElementById('medico').value.trim()
    const leito_id         = document.getElementById('leitoInternacao').value
    const diagnostico      = document.getElementById('diagnostico').value.trim()

    if (!nome || !prontuario || !data_nascimento || !convenio || !medico_responsavel || !leito_id) {
        feedback('feedbackInternar', 'Preencha todos os campos obrigatórios.', 'erro')
        return
    }

    setLoading('btnInternar', true, 'Internar Paciente', 'Internando...')
    try {
        const res = await fetch(`${API_URL}/internacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, prontuario, data_nascimento, convenio, medico_responsavel, leito_id, diagnostico })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackInternar', data.erro || 'Erro ao internar.', 'erro'); return }
        feedback('feedbackInternar', data.mensagem, 'sucesso')
        ;['nome','prontuario','dataNascimento','convenio','medico','diagnostico'].forEach(id => { document.getElementById(id).value = '' })
        carregarLeitosInternaveis()
    } catch { feedback('feedbackInternar', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnInternar', false, 'Internar Paciente', '') }
})

/* ══════════════════════════════════════════════════
   ALTA
══════════════════════════════════════════════════ */

document.getElementById('btnAlta').addEventListener('click', async () => {
    const leito_id = document.getElementById('leitoAlta').value
    if (!leito_id) { feedback('feedbackAlta', 'Selecione o leito para dar alta.', 'erro'); return }

    setLoading('btnAlta', true, 'Confirmar Alta', 'Processando...')
    try {
        const res = await fetch(`${API_URL}/internacoes/alta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leito_id })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackAlta', data.erro || 'Erro ao dar alta.', 'erro'); return }
        feedback('feedbackAlta', data.mensagem, 'sucesso')
        document.getElementById('leitoAlta').value = ''
        carregarLeitosOcupados('leitoAlta')
    } catch { feedback('feedbackAlta', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnAlta', false, 'Confirmar Alta', '') }
})

/* ══════════════════════════════════════════════════
   HIGIENIZAÇÃO
══════════════════════════════════════════════════ */

document.getElementById('btnIniciarHig').addEventListener('click', async () => {
    const leito_id    = document.getElementById('leitoHigienizacao').value
    const responsavel = document.getElementById('responsavelHig').value.trim()

    if (!leito_id || !responsavel) { feedback('feedbackIniciarHig', 'Selecione o leito e informe o responsável.', 'erro'); return }

    setLoading('btnIniciarHig', true, 'Iniciar Higienização', 'Iniciando...')
    try {
        const res = await fetch(`${API_URL}/higienizacoes/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leito_id, responsavel })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackIniciarHig', data.erro || 'Erro ao iniciar.', 'erro'); return }
        feedback('feedbackIniciarHig', data.mensagem, 'sucesso')
        document.getElementById('responsavelHig').value = ''
        carregarLeitosEmHigienizacao()
        carregarHigienizacoesAtivas()
    } catch { feedback('feedbackIniciarHig', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnIniciarHig', false, 'Iniciar Higienização', '') }
})

async function concluirHigienizacao(id, btn) {
    btn.disabled = true
    btn.textContent = 'Concluindo...'
    try {
        const res = await fetch(`${API_URL}/higienizacoes/concluir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ higienizacao_id: id })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackConcluirHig', data.erro || 'Erro ao concluir.', 'erro'); btn.disabled = false; btn.textContent = 'Concluir'; return }
        feedback('feedbackConcluirHig', data.mensagem, 'sucesso')
        carregarLeitosEmHigienizacao()
        carregarHigienizacoesAtivas()
    } catch { feedback('feedbackConcluirHig', 'Erro de conexão.', 'erro'); btn.disabled = false; btn.textContent = 'Concluir' }
}

/* ══════════════════════════════════════════════════
   TRANSFERÊNCIA
══════════════════════════════════════════════════ */

document.getElementById('btnTransferir').addEventListener('click', async () => {
    const leito_origem_id  = document.getElementById('leitoOrigem').value
    const leito_destino_id = document.getElementById('leitoDestino').value

    if (!leito_origem_id || !leito_destino_id) { feedback('feedbackTransferencia', 'Selecione os leitos de origem e destino.', 'erro'); return }
    if (leito_origem_id === leito_destino_id)  { feedback('feedbackTransferencia', 'Leitos de origem e destino devem ser diferentes.', 'erro'); return }

    setLoading('btnTransferir', true, 'Transferir Paciente', 'Transferindo...')
    try {
        const res = await fetch(`${API_URL}/internacoes/transferir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leito_origem_id, leito_destino_id })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackTransferencia', data.erro || 'Erro ao transferir.', 'erro'); return }
        feedback('feedbackTransferencia', data.mensagem, 'sucesso')
        document.getElementById('leitoOrigem').value = ''
        document.getElementById('leitoDestino').value = ''
        carregarLeitosOcupados('leitoOrigem')
        carregarLeitosDisponiveis('leitoDestino')
    } catch { feedback('feedbackTransferencia', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnTransferir', false, 'Transferir Paciente', '') }
})

/* ══════════════════════════════════════════════════
   RESERVA
══════════════════════════════════════════════════ */

document.getElementById('btnReservar').addEventListener('click', async () => {
    const leito_id         = document.getElementById('leitoReserva').value
    const nome_paciente    = document.getElementById('nomeReserva').value.trim()
    const convenio         = document.getElementById('convenioReserva').value.trim()
    const medico           = document.getElementById('medicoReserva').value.trim()
    const previsao_entrada = document.getElementById('previsaoEntrada').value

    if (!leito_id || !nome_paciente) { feedback('feedbackReserva', 'Selecione o leito e informe o nome do paciente.', 'erro'); return }

    setLoading('btnReservar', true, 'Reservar Leito', 'Reservando...')
    try {
        const res = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leito_id, nome_paciente, convenio: convenio || null, medico: medico || null, previsao_entrada: previsao_entrada || null })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackReserva', data.erro || 'Erro ao reservar.', 'erro'); return }
        feedback('feedbackReserva', data.mensagem, 'sucesso')
        ;['leitoReserva','nomeReserva','convenioReserva','medicoReserva','previsaoEntrada'].forEach(id => { document.getElementById(id).value = '' })
        carregarLeitosDisponiveis('leitoReserva')
        carregarReservasAtivas()
    } catch { feedback('feedbackReserva', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnReservar', false, 'Reservar Leito', '') }
})

async function cancelarReserva(id, btn) {
    btn.disabled = true
    btn.textContent = 'Cancelando...'
    try {
        const res = await fetch(`${API_URL}/reservas/${id}/cancelar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackReserva', data.erro || 'Erro ao cancelar.', 'erro'); btn.disabled = false; btn.textContent = 'Cancelar Reserva'; return }
        feedback('feedbackReserva', data.mensagem, 'sucesso')
        carregarLeitosDisponiveis('leitoReserva')
        carregarReservasAtivas()
    } catch { feedback('feedbackReserva', 'Erro de conexão.', 'erro'); btn.disabled = false; btn.textContent = 'Cancelar Reserva' }
}

/* ══════════════════════════════════════════════════
   BLOQUEIO
══════════════════════════════════════════════════ */

document.getElementById('btnBloquear').addEventListener('click', async () => {
    const leito_id    = document.getElementById('leitoBloqueio').value
    const motivo      = document.getElementById('motivoBloqueio').value
    const responsavel = document.getElementById('responsavelBloqueio').value.trim()
    const descricao   = document.getElementById('descricaoBloqueio').value.trim()

    if (!leito_id || !motivo || !responsavel) { feedback('feedbackBloqueio', 'Selecione o leito, motivo e informe o responsável.', 'erro'); return }

    setLoading('btnBloquear', true, 'Bloquear Leito', 'Bloqueando...')
    try {
        const res = await fetch(`${API_URL}/bloqueios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leito_id, motivo, responsavel, descricao: descricao || null })
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackBloqueio', data.erro || 'Erro ao bloquear.', 'erro'); return }
        feedback('feedbackBloqueio', data.mensagem, 'sucesso')
        ;['leitoBloqueio','motivoBloqueio','responsavelBloqueio','descricaoBloqueio'].forEach(id => { document.getElementById(id).value = '' })
        carregarLeitosDisponiveis('leitoBloqueio')
        carregarBloqueiosAtivos()
    } catch { feedback('feedbackBloqueio', 'Erro de conexão com o servidor.', 'erro') }
    finally  { setLoading('btnBloquear', false, 'Bloquear Leito', '') }
})

async function desbloquear(id, btn) {
    btn.disabled = true
    btn.textContent = 'Desbloqueando...'
    try {
        const res = await fetch(`${API_URL}/bloqueios/${id}/desbloquear`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (!res.ok) { feedback('feedbackDesbloquear', data.erro || 'Erro ao desbloquear.', 'erro'); btn.disabled = false; btn.textContent = 'Desbloquear'; return }
        feedback('feedbackDesbloquear', data.mensagem, 'sucesso')
        carregarLeitosDisponiveis('leitoBloqueio')
        carregarBloqueiosAtivos()
    } catch { feedback('feedbackDesbloquear', 'Erro de conexão.', 'erro'); btn.disabled = false; btn.textContent = 'Desbloquear' }
}
