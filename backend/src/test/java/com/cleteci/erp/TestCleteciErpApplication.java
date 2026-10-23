package com.cleteci.erp;

import org.springframework.boot.SpringApplication;

public class TestCleteciErpApplication {

	public static void main(String[] args) {
		SpringApplication.from(CleteciErpApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
