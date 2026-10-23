package com.cleteci.erp.colaboradores.internal;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ColaboradorRepository extends JpaRepository<Colaborador, Long>, JpaSpecificationExecutor<Colaborador> {

	Optional<Colaborador> findByTipoDocumentoAndDocumentoNormalizado(TipoDocumento tipoDocumento,
			String documentoNormalizado);

}
