import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FraudRuleService } from '../../services/FraudRule/fraud-rule-service';

@Component({
  selector: 'app-rule-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rule-management.html',
  styleUrl: './rule-management.css',
})
export class RuleManagement {
  
  private fraudRuleService = inject(FraudRuleService);

  // Observable
  rules = this.fraudRuleService.getFraudRules();

  selectedRule: any = null;

  openEditModal(rule: any) {
    this.selectedRule = JSON.parse(JSON.stringify(rule)); // deep copy
    const modal = document.getElementById('editRuleModal');
    modal!.style.display = 'block';
    modal!.classList.add('show');
  }

  closeModal() {
    const modal = document.getElementById('editRuleModal');
    modal!.style.display = 'none';
    modal!.classList.remove('show');
  }

  saveChanges() {
    this.fraudRuleService.editRule(this.selectedRule).subscribe({
      next: () => {
        alert("Rule updated!");
        this.closeModal();
        this.rules = this.fraudRuleService.getFraudRules(); // refresh table
      },
      error: (err) => console.error("Save failed:", err)
    });
  }
}
