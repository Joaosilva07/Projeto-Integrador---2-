package com.james.app.Controller

import com.james.app.Service.MedicineService
import com.james.app.model.Medicine.Medicine
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/Medicines")
class MedicineController {
    private final MedicineService service;

    MedicineController(MedicineService service) {
        this.service = service;
    }

    @PostMapping
    Medicine create(@RequestBody Medicine medicine) {
        return service.saveMedicine(medicine);
    }

    @GetMapping
    List<Medicine> getAll() {
        return service.getAllMedicines();
    }

    @GetMapping("/{id}")
    Medicine getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    Medicine update(@PathVariable Long id, @RequestBody Medicine medicine) {
        return service.update(id, medicine);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id) {
        service.deleteMedicine(id);
    }

}
