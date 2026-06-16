package com.example.meusgastos.domain.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.meusgastos.domain.model.Titulo;
import com.example.meusgastos.domain.model.Usuario;
import com.example.meusgastos.domain.repository.TituloRepository;
import com.example.meusgastos.dto.titulo.TituloResponseDto;

@ExtendWith(MockitoExtension.class)
public class TituloServiceTest {

    @Mock
    private TituloRepository tituloRepository;

    @Mock
    private ModelMapper mapper;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private TituloService tituloService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void deveObterPorDataDeVencimentoFiltrandoPorUsuarioLogado() {
        // Arrange
        String periodoInicial = "2026-06-01 00:00:00";
        String periodoFinal = "2026-06-30 23:59:59";
        
        Usuario usuario = new Usuario();
        usuario.setId(42L);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(usuario);

        Titulo titulo = new Titulo();
        titulo.setId(10L);
        titulo.setUsuario(usuario);
        titulo.setValor(150.0);

        List<Titulo> titulosMock = Collections.singletonList(titulo);
        when(tituloRepository.obterFluxoCaixaPorDataVencimento(periodoInicial, periodoFinal, 42L))
                .thenReturn(titulosMock);

        TituloResponseDto dtoMock = new TituloResponseDto();
        dtoMock.setId(10L);
        dtoMock.setValor(150.0);
        when(mapper.map(titulo, TituloResponseDto.class)).thenReturn(dtoMock);

        // Act
        List<TituloResponseDto> resultado = tituloService.obterPorDataDeVencimento(periodoInicial, periodoFinal);

        // Assert
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals(10L, resultado.get(0).getId());
        assertEquals(150.0, resultado.get(0).getValor());

        verify(tituloRepository).obterFluxoCaixaPorDataVencimento(periodoInicial, periodoFinal, 42L);
    }
}
