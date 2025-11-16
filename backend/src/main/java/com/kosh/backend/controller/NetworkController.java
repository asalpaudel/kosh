package com.kosh.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosh.backend.model.Network;
import com.kosh.backend.repository.NetworkRepository;

@RestController
@RequestMapping("/api/networks")
public class NetworkController {

    private final NetworkRepository repo;

    public NetworkController(NetworkRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public Network createNetwork(@RequestBody Network network) {
        System.out.println("POST /api/networks hit!");
        System.out.println("Received network: " + network);
        Network saved = repo.save(network);
        System.out.println("Saved network with ID: " + saved.getId());
        return saved;
    }

    @GetMapping
    public List<Network> getAllNetworks() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Network getNetworkById(@PathVariable Long id) {
        System.out.println("GET /api/networks/" + id + " hit!");
        return repo.findById(id).orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deleteNetwork(@PathVariable Long id) {
        repo.deleteById(id);
    }

    @PutMapping("/{id}")
    public Network updateNetwork(@PathVariable Long id, @RequestBody Network net) {
        net.setId(id);
        return repo.save(net);
    }
}