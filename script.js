document.addEventListener("DOMContentLoaded", () => {
  const moeda = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const escapar = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ler = chave => { try { const valor = JSON.parse(localStorage.getItem(chave)); return Array.isArray(valor) ? valor : []; } catch { return []; } };
  let produtos = ler("produtos");
  let clientes = ler("clientes");
  let vendas = ler("vendas");
  let servicos = ler("servicos");

  const links = document.querySelectorAll(".menu a");
  const titulo = document.querySelector(".topbar h2");
  const subtitulo = document.querySelector(".topbar p");

  const cards = document.querySelector(".cards");
  const grid = document.querySelector(".grid");
  const tables = document.querySelector(".tables");
  const paginaExtra = document.querySelector(".pagina-extra");

  function salvar() {
    localStorage.setItem("produtos", JSON.stringify(produtos));
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("vendas", JSON.stringify(vendas));
    localStorage.setItem("servicos", JSON.stringify(servicos));
    atualizarDashboard();
  }

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();

      links.forEach(item => item.classList.remove("active"));
      link.classList.add("active");

      abrirPagina(link.dataset.page);
    });
  });

  new MutationObserver(() => {
    paginaExtra.querySelectorAll("input, select").forEach(campo => {
      if (!campo.getAttribute("aria-label")) campo.setAttribute("aria-label", campo.placeholder || campo.options?.[0]?.text || "Selecione uma opção");
    });
  }).observe(paginaExtra, { childList: true, subtree: true });
  document.querySelectorAll("[data-shortcut]").forEach(botao => botao.addEventListener("click", e => {
    e.preventDefault();
    document.querySelector(`[data-page="${botao.dataset.shortcut}"]`).click();
  }));

  function esconderDashboard() {
    cards.style.display = "none";
    grid.style.display = "none";
    tables.style.display = "none";
    paginaExtra.style.display = "block";
  }

  function abrirPagina(pagina) {
    if (pagina === "dashboard") {
      document.querySelector(".welcome").hidden = false;
      atualizarDashboard();
      titulo.innerText = "Visão geral";
      subtitulo.innerText = "Controle geral da loja Dão Bike";
      cards.style.display = "grid";
      grid.style.display = "grid";
      tables.style.display = "grid";
      paginaExtra.style.display = "none";
      return;
    }

    document.querySelector(".welcome").hidden = true;
    esconderDashboard();

    if (pagina === "produtos") telaProdutos();
    if (pagina === "estoque") telaEstoque();
    if (pagina === "vendas") telaVendas();
    if (pagina === "servicos") telaServicos();
    if (pagina === "clientes") telaClientes();
    if (pagina === "relatorios") telaRelatorios();
    if (pagina === "financeiro") telaFinanceiro();
    if (pagina === "configuracoes") telaConfiguracoes();
  }

  function telaProdutos() {
    titulo.innerText = "Produtos";
    subtitulo.innerText = "Cadastro e gerenciamento de produtos";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Cadastrar Produto</h2>

        <form class="form-sistema" id="formProduto">
          <input id="nomeProduto" placeholder="Nome do produto" required>
          <input id="categoriaProduto" placeholder="Categoria" required>
          <input id="marcaProduto" placeholder="Marca" required>
          <input id="custoProduto" type="number" min="0" step="0.01" placeholder="Preço de custo" required>
          <input id="vendaProduto" type="number" min="0" step="0.01" placeholder="Preço de venda" required>
          <input id="qtdProduto" type="number" min="0" step="1" placeholder="Quantidade" required>
          <button type="submit">Salvar Produto</button>
        </form>
      </div>

      <div class="table-box full" style="margin-top:20px;">
        <h2>Produtos Cadastrados</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Marca</th>
              <th>Custo</th>
              <th>Venda</th>
              <th>Qtd</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${produtos.map((p, i) => `
              <tr>
                <td>${escapar(p.nome)}</td>
                <td>${escapar(p.categoria)}</td>
                <td>${escapar(p.marca)}</td>
                <td>${moeda(p.custo)}</td>
                <td>${moeda(p.venda)}</td>
                <td>${p.qtd}</td>
                <td><button onclick="excluirProduto(${i})">Excluir</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("formProduto").addEventListener("submit", e => {
      e.preventDefault();

      produtos.push({
        nome: nomeProduto.value,
        categoria: categoriaProduto.value,
        marca: marcaProduto.value,
        custo: Number(custoProduto.value),
        venda: Number(vendaProduto.value),
        qtd: Number(qtdProduto.value)
      });

      salvar();
      telaProdutos();
    });
  }

  window.excluirProduto = function(index) {
    produtos.splice(index, 1);
    salvar();
    telaProdutos();
  };

  function telaEstoque() {
    titulo.innerText = "Estoque";
    subtitulo.innerText = "Controle de entrada e saída de produtos";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Estoque Atual</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${produtos.map(p => `
              <tr>
                <td>${escapar(p.nome)}</td>
                <td>${escapar(p.categoria)}</td>
                <td>${p.qtd}</td>
                <td>${p.qtd <= 5 ? '<span class="red">Estoque baixo</span>' : 'Normal'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function mesDaVenda(valor) {
    if (!valor) return "sem-data";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "sem-data";
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  }

  function nomeDoMes(mes) {
    if (mes === "sem-data") return "Vendas antigas sem data";
    const [ano, numero] = mes.split("-").map(Number);
    return new Date(ano, numero - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  function telaVendas(mesSelecionado = mesDaVenda(new Date())) {
    const mesAtual = mesDaVenda(new Date());
    const meses = [...new Set([mesAtual, ...vendas.map(v => mesDaVenda(v.data))])].filter(m => m !== "sem-data").sort().reverse();
    if (vendas.some(v => mesDaVenda(v.data) === "sem-data")) meses.push("sem-data");
    const vendasDoMes = vendas.filter(v => mesDaVenda(v.data) === mesSelecionado);
    const totalDoMes = vendasDoMes.reduce((total, v) => total + Number(v.total), 0);
    titulo.innerText = "Vendas";
    subtitulo.innerText = "Registro de vendas da loja";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Registrar Venda</h2>

        <form class="form-sistema" id="formVenda">
          <input id="clienteVenda" placeholder="Cliente" required>

          <select id="produtoVenda" required>
            <option value="">Selecione o produto</option>
            ${produtos.map((p, i) => `
              <option value="${i}">${escapar(p.nome)} - ${moeda(p.venda)}</option>
            `).join("")}
          </select>

          <input id="qtdVenda" type="number" min="1" step="1" placeholder="Quantidade" required>

          <select id="pagamentoVenda">
            <option>PIX</option>
            <option>Cartão</option>
            <option>Dinheiro</option>
          </select>

          <button type="submit">Finalizar Venda</button>
        </form>
      </div>

      <div class="table-box full" style="margin-top:20px;">
        <div class="history-heading">
          <div><h2>Histórico de vendas</h2><p class="history-note">Cada mês tem seu próprio histórico. As vendas anteriores continuam salvas.</p></div>
          <label class="month-filter">Consultar período
            <select id="mesHistorico">${meses.map(mes => `<option value="${mes}" ${mes === mesSelecionado ? "selected" : ""}>${nomeDoMes(mes)}${mes === mesAtual ? " (mês atual)" : ""}</option>`).join("")}</select>
          </label>
        </div>
        <p class="history-summary">${vendasDoMes.length} venda(s) · Total: <strong>${moeda(totalDoMes)}</strong></p>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Total</th>
              <th>Lucro</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            ${vendasDoMes.slice().reverse().map(v => `
              <tr>
                <td>${escapar(v.cliente)}</td>
                <td>${escapar(v.produto)}</td>
                <td>${v.qtd}</td>
                <td>${moeda(v.total)}</td>
                <td>${moeda(v.lucro)}</td>
                <td>${escapar(v.pagamento)}</td>
              </tr>
            `).join("") || '<tr><td colspan="6" class="empty-state">Nenhuma venda registrada neste período.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("mesHistorico").addEventListener("change", e => telaVendas(e.target.value));
    document.getElementById("formVenda").addEventListener("submit", e => {
      e.preventDefault();

      const indexProduto = Number(produtoVenda.value);
      const produto = produtos[indexProduto];
      const qtd = Number(qtdVenda.value);

      if (!produto || !Number.isInteger(qtd) || qtd <= 0 || qtd > produto.qtd) {
        alert("Produto inválido ou estoque insuficiente.");
        return;
      }

      const total = produto.venda * qtd;
      const lucro = (produto.venda - produto.custo) * qtd;

      produto.qtd -= qtd;

      vendas.push({
        cliente: clienteVenda.value,
        produto: produto.nome,
        qtd,
        total,
        lucro,
        data: new Date().toISOString(),
        pagamento: pagamentoVenda.value
      });

      salvar();
      telaVendas();
    });
  }

  function telaServicos() {
    titulo.innerText = "Serviços / Consertos";
    subtitulo.innerText = "Controle de ordens de serviço";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Nova Ordem de Serviço</h2>

        <form class="form-sistema" id="formServico">
          <input id="clienteServico" placeholder="Cliente" required>
          <input id="bikeServico" placeholder="Bicicleta" required>
          <input id="descricaoServico" placeholder="Serviço realizado" required>
          <input id="maoObraServico" type="number" min="0" step="0.01" placeholder="Mão de obra" required>
          <input id="pecasServico" type="number" min="0" step="0.01" placeholder="Valor das peças" required>

          <select id="statusServico">
            <option>Em andamento</option>
            <option>Finalizado</option>
            <option>Entregue</option>
          </select>

          <button type="submit">Salvar Serviço</button>
        </form>
      </div>

      <div class="table-box full" style="margin-top:20px;">
        <h2>Serviços Cadastrados</h2>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Bicicleta</th>
              <th>Serviço</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${servicos.map(s => `
              <tr>
                <td>${escapar(s.cliente)}</td>
                <td>${escapar(s.bike)}</td>
                <td>${escapar(s.descricao)}</td>
                <td>${moeda(s.total)}</td>
                <td>${escapar(s.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("formServico").addEventListener("submit", e => {
      e.preventDefault();

      const total = Number(maoObraServico.value) + Number(pecasServico.value);

      servicos.push({
        cliente: clienteServico.value,
        bike: bikeServico.value,
        descricao: descricaoServico.value,
        total,
        status: statusServico.value
      });

      salvar();
      telaServicos();
    });
  }

  function telaClientes() {
    titulo.innerText = "Clientes";
    subtitulo.innerText = "Cadastro de clientes";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Cadastrar Cliente</h2>

        <form class="form-sistema" id="formCliente">
          <input id="nomeCliente" placeholder="Nome" required>
          <input id="telefoneCliente" placeholder="Telefone" required>
          <input id="emailCliente" placeholder="E-mail">
          <input id="cidadeCliente" placeholder="Cidade">
          <button type="submit">Salvar Cliente</button>
        </form>
      </div>

      <div class="table-box full" style="margin-top:20px;">
        <h2>Clientes Cadastrados</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Cidade</th>
            </tr>
          </thead>
          <tbody>
            ${clientes.map(c => `
              <tr>
                <td>${escapar(c.nome)}</td>
                <td>${escapar(c.telefone)}</td>
                <td>${escapar(c.email)}</td>
                <td>${escapar(c.cidade)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("formCliente").addEventListener("submit", e => {
      e.preventDefault();

      clientes.push({
        nome: nomeCliente.value,
        telefone: telefoneCliente.value,
        email: emailCliente.value,
        cidade: cidadeCliente.value
      });

      salvar();
      telaClientes();
    });
  }

  function telaRelatorios() {
    titulo.innerText = "Relatórios";
    subtitulo.innerText = "Resumo geral da loja";

    const totalVendas = vendas.reduce((s, v) => s + Number(v.total), 0);
    const lucro = vendas.reduce((s, v) => s + Number(v.lucro), 0);
    const estoque = produtos.reduce((s, p) => s + Number(p.qtd), 0);

    paginaExtra.innerHTML = `
      <div class="cards" style="padding:0;">
        <div class="card">
          <div>
            <span>Total vendido</span>
            <h3>${moeda(totalVendas)}</h3>
          </div>
        </div>

        <div class="card">
          <div>
            <span>Lucro total</span>
            <h3>${moeda(lucro)}</h3>
          </div>
        </div>

        <div class="card">
          <div>
            <span>Produtos em estoque</span>
            <h3>${estoque}</h3>
          </div>
        </div>
      </div>
    `;
  }

  function telaFinanceiro() {
    titulo.innerText = "Financeiro";
    subtitulo.innerText = "Controle de faturamento e lucro";

    const faturamento = vendas.reduce((s, v) => s + Number(v.total), 0);
    const lucro = vendas.reduce((s, v) => s + Number(v.lucro), 0);
    const custo = faturamento - lucro;

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Resumo Financeiro</h2>

        <table>
          <tr>
            <th>Faturamento</th>
            <td>${moeda(faturamento)}</td>
          </tr>

          <tr>
            <th>Custo dos produtos</th>
            <td>${moeda(custo)}</td>
          </tr>

          <tr>
            <th>Lucro</th>
            <td class="green">${moeda(lucro)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  function telaConfiguracoes() {
    titulo.innerText = "Configurações";
    subtitulo.innerText = "Ajustes do sistema";

    paginaExtra.innerHTML = `
      <div class="table-box full">
        <h2>Configurações</h2>

        <button onclick="limparSistema()">Limpar todos os dados</button>
      </div>
    `;
  }

  window.limparSistema = function() {
    if (confirm("Deseja apagar todos os dados?")) {
      ["produtos", "clientes", "vendas", "servicos"].forEach(chave => localStorage.removeItem(chave));
      location.reload();
    }
  };


  let graficos = [];
  function atualizarDashboard() {
    const agora = new Date();
    const doMes = vendas.filter(v => { const d = new Date(v.data); return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear(); });
    const valores = [moeda(doMes.reduce((a,v) => a + Number(v.total),0)), moeda(doMes.reduce((a,v) => a + Number(v.lucro),0)), produtos.reduce((a,p) => a + Number(p.qtd),0), servicos.filter(s => s.status === "Em andamento").length];
    cards.querySelectorAll("h3").forEach((el,i) => el.textContent = valores[i]);
    cards.querySelectorAll(".card p")[0].textContent = "Vendas registradas no mês";
    cards.querySelectorAll(".card p")[1].textContent = "Margem bruta das vendas";
    const vazio = colunas => `<tr><td colspan="${colunas}" class="empty-state">Nenhum registro por aqui ainda.</td></tr>`;
    const corpos = tables.querySelectorAll("tbody");
    corpos[0].innerHTML = produtos.filter(p => p.qtd <= 5).slice(0,5).map(p => `<tr><td>${escapar(p.nome)}</td><td>${escapar(p.categoria)}</td><td class="red">${Number(p.qtd)}</td></tr>`).join("") || vazio(3);
    corpos[1].innerHTML = vendas.slice(-5).reverse().map(v => `<tr><td>${escapar(v.cliente)}</td><td>${moeda(v.total)}</td><td><span class="badge pix">${escapar(v.pagamento)}</span></td></tr>`).join("") || vazio(3);
    corpos[2].innerHTML = servicos.slice(-5).reverse().map(s => `<tr><td>${escapar(s.cliente)}</td><td>${escapar(s.descricao)}</td><td><span class="badge ${s.status === "Em andamento" ? "progress" : "done"}">${escapar(s.status)}</span></td></tr>`).join("") || vazio(3);
    graficos.forEach(g => g.destroy()); graficos = [];
    if (typeof Chart === "undefined") {
      grid.querySelectorAll("canvas").forEach(c => { c.hidden = true; if (!c.nextElementSibling) c.insertAdjacentHTML("afterend", '<p class="empty-state">Gráfico indisponível. Verifique sua conexão.</p>'); });
      return;
    }
    const meses = Array.from({length:6}, (_,i) => new Date(agora.getFullYear(),agora.getMonth()-5+i,1));
    const labels = meses.map(d => d.toLocaleDateString("pt-BR",{month:"short"}));
    const somar = campo => meses.map(m => vendas.filter(v => { const d = new Date(v.data); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).reduce((a,v) => a + Number(v[campo]),0));
    const ranking = {};
    vendas.forEach(v => { ranking[v.produto] = (ranking[v.produto] || 0) + Number(v.qtd); });
    const top = Object.entries(ranking).sort((a,b) => b[1]-a[1]).slice(0,5);
    const criar = (id,type,nomes,dados,cor) => {
      graficos.push(new Chart(document.getElementById(id), {type, data:{labels:nomes,datasets:[{data:dados,backgroundColor:cor,borderColor:typeof cor === "string" ? cor : "#168478",borderRadius:5,tension:.35,fill:false}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:type === "doughnut",position:"bottom"}}, scales:type === "doughnut" ? {} : {y:{beginAtZero:true,grid:{color:"#edf0f4"}},x:{grid:{display:false}}}}}));
    };
    criar("vendasChart","bar",labels,somar("total"),"#168478");
    criar("lucroChart","line",labels,somar("lucro"),"#3779d0");
    criar("produtosChart","doughnut",top.length ? top.map(p => p[0]) : ["Sem vendas"],top.length ? top.map(p => p[1]) : [1],top.length ? ["#168478","#3779d0","#eab15b","#8c78cc","#aec5c3"] : ["#e8edef"]);
  }
  atualizarDashboard();
  let ultimoMes = mesDaVenda(new Date());
  function verificarViradaDoMes() {
    const mes = mesDaVenda(new Date());
    if (mes === ultimoMes) return;
    ultimoMes = mes;
    atualizarDashboard();
    if (document.querySelector('.menu a.active')?.dataset.page === "vendas") telaVendas();
  }
  setInterval(verificarViradaDoMes, 30000);
  document.addEventListener("visibilitychange", verificarViradaDoMes);
});
