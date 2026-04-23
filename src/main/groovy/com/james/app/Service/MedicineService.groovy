package com.james.app.Service

import com.james.app.Repository.MedicineRepository
import com.james.app.Repository.UserRepository
import com.james.app.model.Medicine.Medicine
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class MedicineService {
    private final MedicineRepository medicineRepository;

    MedicineService(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }


    Medicine saveMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }


    Medicine update(Long id, Medicine newMedicine) {

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"));

         medicine.setNomeMedicamento(newMedicine.getNomeMedicamento());
         medicine.setDataValidade(newMedicine.getDataValidade());


        return medicineRepository.save(medicine);
    }
     void deleteMedicine(Long id) {

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"));

        medicineRepository.delete(medicine);
    }
     Medicine getById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"));
    }
     List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
}
