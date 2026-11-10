# Decisões de arquitetura (ADRs)

Cada arquivo registra **uma** decisão técnica: o contexto, o que foi decidido, o que foi rejeitado e as consequências. Cabe em uma página.

Regras:

- Toda decisão de arquitetura (stack, dados, estrutura, segurança, processo) tem um ADR **antes** do código que depende dela.
- Um ADR aceito não é editado para mudar a decisão. Uma decisão nova ganha um ADR novo, e o antigo recebe `Estado: Superado por ADR-NNNN`. Nada é apagado.
- Decisões de produto não ficam aqui: ficam no `SPEC.md` e são do dono.

| ADR | Decisão | Estado |
| --- | --- | --- |
| [0001](0001-metodo-de-trabalho.md) | Método de trabalho: SPEC na raiz, superpowers, um plano por fatia | Aceito |
| [0002](0002-forma-do-produto.md) | App local que abre no navegador | Aceito |
| [0003](0003-stack.md) | TypeScript em tudo, Node, React, Hono | Aceito |
| [0004](0004-dados.md) | Pasta de biblioteca com SQLite e imagens como arquivos | Aceito |
| [0005](0005-estrutura-de-pastas.md) | Um pacote só; pastas nascem quando uma fatia precisa | Aceito |
| [0006](0006-testes-e-ci.md) | Um comando de verificação; CI em Linux, Windows e Mac | Aceito; "só com Chromium" superado pelo ADR-0010 |
| [0007](0007-seguranca.md) | Servidor só local; ameaças de uma pessoa, um computador | Aceito |
| [0008](0008-idiomas.md) | Tela em pt-BR e en por dicionários; docs em português, código em inglês | Aceito |
| [0009](0009-papeis-dos-modelos-e-ciclo-da-fatia.md) | Papel de cada modelo, limites de correção e ciclo da fatia | Aceito |
| [0010](0010-testes-tambem-no-firefox.md) | Testes de ponta a ponta no Chromium e no Firefox | Aceito |
