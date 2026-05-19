// Função para converter número em extenso seguindo regras do português brasileiro
export const numeroParaExtenso = (valor: number): string => {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const parteInteira = Math.floor(valor);
  const centavos = Math.round((valor - parteInteira) * 100);

  let resultado = '';

  if (parteInteira === 0) {
    resultado = 'zero reais';
  } else {
    const milhares = Math.floor(parteInteira / 1000);
    const restante = parteInteira % 1000;
    
    if (milhares > 0) {
      if (milhares === 1) {
        resultado += 'mil';
      } else {
        const c = Math.floor(milhares / 100);
        const d = Math.floor((milhares % 100) / 10);
        const u = milhares % 10;
        
        if (c > 0) resultado += centenas[c];
        if (d === 1) {
          if (resultado) resultado += ' e ';
          resultado += especiais[u];
        } else {
          if (d > 0) {
            if (resultado) resultado += ' e ';
            resultado += dezenas[d];
          }
          if (u > 0) {
            if (resultado) resultado += ' e ';
            resultado += unidades[u];
          }
        }
        resultado += ' mil';
      }
    }

    const c = Math.floor(restante / 100);
    const d = Math.floor((restante % 100) / 10);
    const u = restante % 10;

    if (c > 0) {
      if (resultado && restante > 0) resultado += ' ';
      if (restante === 100) {
        resultado += 'cem';
      } else {
        resultado += centenas[c];
      }
    }

    if (d === 1) {
      if (resultado) resultado += ' e ';
      resultado += especiais[u];
    } else {
      if (d > 0) {
        if (resultado) resultado += ' e ';
        resultado += dezenas[d];
      }
      if (u > 0) {
        if (resultado) resultado += ' e ';
        resultado += unidades[u];
      }
    }

    resultado += parteInteira === 1 ? ' real' : ' reais';
  }

  if (centavos > 0) {
    const d = Math.floor(centavos / 10);
    const u = centavos % 10;
    
    resultado += ' e ';
    
    if (d === 1) {
      resultado += especiais[u];
    } else {
      if (d > 0) resultado += dezenas[d];
      if (u > 0) {
        if (d > 0) resultado += ' e ';
        resultado += unidades[u];
      }
    }
    
    resultado += centavos === 1 ? ' centavo' : ' centavos';
  }

  return resultado;
};
